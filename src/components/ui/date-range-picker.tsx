"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

/** Dates are plain YYYY-MM-DD strings, so there are no time zone surprises. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface DateRangePreset {
  label: string;
  /** Gets today's date and returns the range to select. */
  range: (today: string) => DateRange;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  /** Longest range allowed, in days, counting both ends. */
  maxDays?: number;
  presets?: DateRangePreset[] | false;
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: 0 | 1;
  locale?: string;
  accent?: string;
  className?: string;
}

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const toDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => toDay(toMs(d) + n * DAY);
const addMonths = (d: string, n: number) => {
  const dt = new Date(toMs(d));
  const target = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(dt.getUTCDate(), last));
  return toDay(target.getTime());
};
const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY) + 1;

// Today's date, read on the client only. The server and the first client render agree on null,
// then React swaps in the real date, so there's no hydration mismatch.
const noop = () => () => {};
const useToday = () =>
  useSyncExternalStore(
    noop,
    () => {
      const now = new Date();
      return toDay(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    },
    () => null,
  );

export const defaultPresets: DateRangePreset[] = [
  { label: "Today", range: (t) => ({ start: t, end: t }) },
  { label: "Last 7 days", range: (t) => ({ start: addDays(t, -6), end: t }) },
  { label: "Last 30 days", range: (t) => ({ start: addDays(t, -29), end: t }) },
  { label: "This month", range: (t) => ({ start: monthStart(t), end: t }) },
  {
    label: "Last month",
    range: (t) => {
      const start = monthStart(addMonths(t, -1));
      return { start, end: addDays(monthStart(t), -1) };
    },
  },
  { label: "Year to date", range: (t) => ({ start: `${t.slice(0, 4)}-01-01`, end: t }) },
];

export function DateRangePicker({
  value,
  onChange,
  label = "Dates",
  minDate,
  maxDate,
  maxDays,
  presets = defaultPresets,
  weekStart = 1,
  locale = "en-US",
  accent = "#38bdf8",
  className = "",
}: DateRangePickerProps) {
  const id = useId();
  const today = useToday();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // While picking: the first click sets `anchor`, the second finishes the range.
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null);
  const [shift, setShift] = useState(0);

  const base = focusDay ?? value.start ?? today ?? minDate ?? "2026-01-01";
  const shownMonth = view ?? monthStart(base);

  const fmtDay = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const fmtMonth = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const fmtLong = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    // 2023-01-01 was a Sunday.
    return Array.from({ length: 7 }, (_, i) => f.format(Date.UTC(2023, 0, 1 + ((i + weekStart) % 7))));
  }, [locale, weekStart]);

  // Move real focus to the active day whenever it changes while open.
  useEffect(() => {
    if (open && focusDay) gridRef.current?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [open, focusDay, shownMonth]);

  // Close on a press outside the picker.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  });

  const isDisabled = (d: string) => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    // While picking the end, days that would make the range too long are off limits.
    if (anchor && maxDays) {
      const [a, b] = d < anchor ? [d, anchor] : [anchor, d];
      if (daysBetween(a, b) > maxDays) return true;
    }
    return false;
  };

  const openPicker = () => {
    // Start on the selection, else today, clamped into the allowed dates so focus lands on an enabled day.
    let start = value.start ?? today ?? minDate ?? "2026-01-01";
    if (minDate && start < minDate) start = minDate;
    if (maxDate && start > maxDate) start = maxDate;
    // Shift the popup left when it would run past the right edge of the screen.
    const rect = rootRef.current?.getBoundingClientRect();
    const width = Math.min(presets ? 672 : 576, window.innerWidth - 32);
    setShift(rect ? Math.min(0, window.innerWidth - 16 - (rect.left + width)) : 0);
    setFocusDay(start);
    setView(monthStart(start));
    setAnchor(null);
    setHover(null);
    setOpen(true);
  };

  function close(returnFocus = true) {
    setOpen(false);
    setAnchor(null);
    setHover(null);
    if (returnFocus) triggerRef.current?.focus();
  }

  const pick = (d: string) => {
    if (isDisabled(d)) return;
    if (!anchor) {
      setAnchor(d);
      setFocusDay(d);
      return;
    }
    const [start, end] = d < anchor ? [d, anchor] : [anchor, d];
    onChange({ start, end });
    close();
  };

  const moveFocus = (d: string) => {
    if (minDate && d < minDate) d = minDate;
    if (maxDate && d > maxDate) d = maxDate;
    setFocusDay(d);
    setHover(anchor ? d : null);
    // Keep the focused day inside the visible months.
    const first = shownMonth;
    const lastVisible = addDays(monthStart(addMonths(first, 2)), -1);
    if (d < first) setView(monthStart(d));
    else if (d > lastVisible) setView(monthStart(addMonths(d, -1)));
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = focusDay ?? shownMonth;
    const weekday = (new Date(toMs(d)).getUTCDay() - weekStart + 7) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
      Home: () => addDays(d, -weekday),
      End: () => addDays(d, 6 - weekday),
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveFocus(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(d);
    }
  };

  const previewEnd = anchor ? (hover ?? focusDay ?? anchor) : null;
  const rangeStart = anchor ? (previewEnd! < anchor ? previewEnd : anchor) : value.start;
  const rangeEnd = anchor ? (previewEnd! < anchor ? anchor : previewEnd) : value.end;

  const month = (first: string, extraClass = "") => {
    const lead = (new Date(toMs(first)).getUTCDay() - weekStart + 7) % 7;
    const gridStart = addDays(first, -lead);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7)).filter((wk) =>
      wk.some((d) => d.slice(0, 7) === first.slice(0, 7)),
    );
    return (
      <div className={extraClass}>
        <p className="mb-2 text-center text-sm font-semibold text-zinc-100" aria-live="polite">
          {fmtMonth.format(toMs(first))}
        </p>
        <div role="grid" aria-label={fmtMonth.format(toMs(first))}>
          <div role="row" className="grid grid-cols-7">
            {weekdays.map((w) => (
              <span key={w} role="columnheader" className="py-1 text-center text-[11px] font-medium text-zinc-500">
                {w.slice(0, 2)}
              </span>
            ))}
          </div>
          {weeks.map((wk) => (
            <div role="row" key={wk[0]} className="grid grid-cols-7">
              {wk.map((d) => {
                const inMonth = d.slice(0, 7) === first.slice(0, 7);
                if (!inMonth) return <span key={d} role="gridcell" className="h-9" />;
                const disabled = isDisabled(d);
                const isStart = d === rangeStart;
                const isEnd = d === rangeEnd;
                const inside = !!rangeStart && !!rangeEnd && d > rangeStart && d < rangeEnd;
                const selected = isStart || isEnd || inside;
                return (
                  <span
                    key={d}
                    role="gridcell"
                    aria-selected={selected || undefined}
                    className={[
                      "relative h-9",
                      inside ? "bg-[color-mix(in_oklab,var(--dr-accent)_16%,transparent)]" : "",
                      isStart && rangeEnd && rangeEnd !== rangeStart
                        ? "rounded-l-full bg-[color-mix(in_oklab,var(--dr-accent)_16%,transparent)]"
                        : "",
                      isEnd && rangeStart && rangeEnd !== rangeStart
                        ? "rounded-r-full bg-[color-mix(in_oklab,var(--dr-accent)_16%,transparent)]"
                        : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === focusDay ? 0 : -1}
                      disabled={disabled}
                      aria-label={`${fmtLong.format(toMs(d))}${isStart ? ", start" : ""}${isEnd ? ", end" : ""}${d === today ? ", today" : ""}`}
                      aria-pressed={isStart || isEnd || undefined}
                      onClick={() => pick(d)}
                      onMouseEnter={() => anchor && setHover(d)}
                      onFocus={() => setFocusDay(d)}
                      className={[
                        "relative mx-auto grid size-9 place-items-center rounded-full text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dr-accent)]",
                        isStart || isEnd
                          ? "bg-[var(--dr-accent)] font-semibold text-zinc-950"
                          : disabled
                            ? "cursor-not-allowed text-zinc-700 line-through"
                            : "text-zinc-200 hover:bg-zinc-800",
                      ].join(" ")}
                    >
                      {Number(d.slice(8))}
                      {d === today && !isStart && !isEnd && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 size-1 rounded-full bg-[var(--dr-accent)]"
                        />
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const summary =
    value.start && value.end
      ? value.start === value.end
        ? fmtDay.format(toMs(value.start))
        : `${fmtDay.format(toMs(value.start))} – ${fmtDay.format(toMs(value.end))}`
      : "Select dates";

  const pickingHint = anchor
    ? `Start ${fmtDay.format(toMs(anchor))}. Now pick the end date.`
    : value.start && value.end
      ? `${daysBetween(value.start, value.end)} days selected`
      : "Pick a start date.";

  const navBtn =
    "grid size-8 place-items-center rounded-lg text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dr-accent)] disabled:opacity-30";

  return (
    <div
      ref={rootRef}
      style={{ "--dr-accent": accent } as CSSProperties}
      className={["relative inline-block text-left", className].join(" ")}
    >
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium text-zinc-200">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => e.key === "ArrowDown" && !open && (e.preventDefault(), openPicker())}
        className="inline-flex h-10 min-w-64 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dr-accent)]"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-zinc-500" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 6H4v8h12V8Z"
            clipRule="evenodd"
          />
        </svg>
        <span id={`${id}-value`} className={value.start ? "" : "text-zinc-500"}>
          {summary}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={`Choose ${label.toLowerCase()}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              // First Escape cancels a half-picked range, the second closes.
              if (anchor) {
                setAnchor(null);
                setHover(null);
              } else close();
            }
          }}
          style={{ left: shift }}
          className={[
            "absolute top-full z-30 mt-2 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl",
            presets ? "w-[min(42rem,calc(100vw-2rem))]" : "w-[min(36rem,calc(100vw-2rem))]",
          ].join(" ")}
        >
          <div className="flex flex-col gap-4 md:flex-row">
            {presets && (
              <ul
                className="flex gap-1 overflow-x-auto pb-1 md:w-36 md:shrink-0 md:flex-col md:overflow-visible md:border-r md:border-zinc-800 md:pb-0 md:pr-3"
                aria-label="Quick ranges"
              >
                {presets.map((p) => {
                  const r = today ? p.range(today) : null;
                  const activePreset = r && r.start === value.start && r.end === value.end;
                  return (
                    <li key={p.label} className="shrink-0">
                      <button
                        type="button"
                        disabled={!r}
                        aria-pressed={!!activePreset}
                        onClick={() => {
                          if (!r) return;
                          onChange(r);
                          close();
                        }}
                        className={[
                          "w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dr-accent)]",
                          activePreset
                            ? "bg-zinc-800 text-zinc-50"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                        ].join(" ")}
                      >
                        {p.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="min-w-0 flex-1">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setView(addMonths(shownMonth, -1))}
                  disabled={!!minDate && shownMonth <= monthStart(minDate)}
                  className={`${navBtn} absolute left-0 top-0`}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setView(addMonths(shownMonth, 1))}
                  disabled={!!maxDate && addMonths(shownMonth, 1) > maxDate}
                  className={`${navBtn} absolute right-0 top-0`}
                >
                  ›
                </button>
                <div
                  ref={gridRef}
                  onKeyDown={onGridKey}
                  onMouseLeave={() => setHover(null)}
                  className="grid gap-6 px-1 sm:grid-cols-2"
                >
                  {month(shownMonth)}
                  {month(addMonths(shownMonth, 1), "hidden sm:block")}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3 text-sm">
                <p className="text-zinc-400" aria-live="polite">
                  {pickingHint}
                  {maxDays ? <span className="text-zinc-600"> · up to {maxDays} days</span> : null}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ start: null, end: null });
                    setAnchor(null);
                    setHover(null);
                  }}
                  disabled={!value.start && !anchor}
                  className="rounded px-2 py-1 text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dr-accent)] disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
