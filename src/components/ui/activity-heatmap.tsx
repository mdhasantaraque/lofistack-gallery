"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export interface HeatmapDay {
  /** Calendar date as YYYY-MM-DD. Read as UTC, so it never shifts with the viewer's time zone. */
  date: string;
  count: number;
}

export interface ActivityHeatmapProps {
  data: HeatmapDay[];
  /** Accessible name for the grid, e.g. "Commits in the last year". */
  label: string;
  /** Last day shown, YYYY-MM-DD. Defaults to the latest date in `data`. */
  endDate?: string;
  /** Number of week columns. */
  weeks?: number;
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: 0 | 1;
  /** Any CSS color. The four activity levels are mixed from it. */
  accent?: string;
  /** Singular and plural unit used in labels and tooltips. */
  unit?: [string, string];
  locale?: string;
  onSelectDay?: (day: HeatmapDay) => void;
  /** Shows total, active days and streaks above the grid. */
  showStats?: boolean;
  className?: string;
}

const DAY = 86_400_000;
const CELL = 12;
const GAP = 3;
const LEVEL_MIX = [0, 28, 50, 75, 100];

const parseDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function ActivityHeatmap({
  data,
  label,
  endDate,
  weeks = 52,
  weekStart = 0,
  accent = "#34d399",
  unit = ["contribution", "contributions"],
  locale = "en-US",
  onSelectDay,
  showStats = true,
  className = "",
}: ActivityHeatmapProps) {
  const id = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<{ col: number; row: number } | null>(null);
  const [tip, setTip] = useState<{ col: number; row: number } | null>(null);

  const model = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of data) counts.set(d.date, (counts.get(d.date) ?? 0) + d.count);

    const latest = data.reduce((acc, d) => (d.date > acc ? d.date : acc), "");
    const end = parseDay(endDate ?? (latest || "1970-01-01"));
    const endWeekday = new Date(end).getUTCDay();
    const lastColStart = end - ((endWeekday - weekStart + 7) % 7) * DAY;
    const firstColStart = lastColStart - (weeks - 1) * 7 * DAY;

    // columns[col][row] -> day or null for days after `end`
    const columns: (HeatmapDay | null)[][] = [];
    const visible: number[] = [];
    for (let col = 0; col < weeks; col++) {
      const column: (HeatmapDay | null)[] = [];
      for (let row = 0; row < 7; row++) {
        const ms = firstColStart + (col * 7 + row) * DAY;
        if (ms > end) {
          column.push(null);
          continue;
        }
        const key = dayKey(ms);
        const count = counts.get(key) ?? 0;
        column.push({ date: key, count });
        visible.push(count);
      }
      columns.push(column);
    }

    // Quartiles of the non-zero days, so one huge day doesn't wash everything else out.
    const nonZero = visible.filter((c) => c > 0).sort((a, b) => a - b);
    const q = (p: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))] ?? 0;
    const thresholds = [q(0.25), q(0.5), q(0.75)];
    const level = (count: number) => (count <= 0 ? 0 : 1 + thresholds.filter((t) => count > t).length);

    // Stats, walking day by day through the visible range.
    let total = 0;
    let activeDays = 0;
    let longest = 0;
    let run = 0;
    for (const c of visible) {
      total += c;
      if (c > 0) {
        activeDays += 1;
        run += 1;
        longest = Math.max(longest, run);
      } else run = 0;
    }
    // A zero on the last day doesn't break the current streak yet; the day isn't over.
    let current = 0;
    for (let i = visible.length - 1 - (visible.at(-1) === 0 ? 1 : 0); i >= 0 && visible[i] > 0; i--) current += 1;

    const months: { col: number; text: string }[] = [];
    const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    let lastMonth = -1;
    columns.forEach((column, col) => {
      const first = column[0];
      if (!first) return;
      const month = new Date(parseDay(first.date)).getUTCMonth();
      if (month !== lastMonth) {
        months.push({ col, text: monthFmt.format(parseDay(first.date)) });
        lastMonth = month;
      }
    });
    // Drop a label squeezed against the next one.
    const monthLabels = months.filter((m, i) => !(i === 0 && months[1] && months[1].col - m.col < 3));

    return { columns, level, total, activeDays, longest, current, monthLabels };
  }, [data, endDate, weeks, weekStart, locale]);

  const longDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );
  const weekdayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }), [locale]);

  const describe = (day: HeatmapDay) =>
    `${day.count === 0 ? "No" : day.count.toLocaleString(locale)} ${day.count === 1 ? unit[0] : unit[1]} on ${longDate.format(parseDay(day.date))}`;

  // Start scrolled to the most recent weeks on narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  const lastCol = model.columns.length - 1;
  const lastFilledRow = model.columns[lastCol].findLastIndex((d) => d !== null);
  const active = focus ?? { col: lastCol, row: lastFilledRow };

  const moveFocus = (col: number, row: number) => {
    const c = Math.max(0, Math.min(lastCol, col));
    const r = Math.max(0, Math.min(6, row));
    if (!model.columns[c][r]) return;
    setFocus({ col: c, row: r });
    setTip({ col: c, row: r });
    document.getElementById(`${id}-${c}-${r}`)?.focus();
  };

  const onKeyDown = (col: number, row: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    const day = model.columns[col][row];
    const keys: Record<string, () => void> = {
      ArrowUp: () => moveFocus(col, row - 1),
      ArrowDown: () => moveFocus(col, row + 1),
      ArrowLeft: () => moveFocus(col - 1, row),
      ArrowRight: () => moveFocus(col + 1, row),
      Home: () => moveFocus(0, row),
      End: () => moveFocus(model.columns[lastCol][row] ? lastCol : lastCol - 1, row),
      Enter: () => day && onSelectDay?.(day),
      " ": () => day && onSelectDay?.(day),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  };

  const tipDay = tip ? model.columns[tip.col][tip.row] : null;
  const tipAlign = tip ? (tip.col < 4 ? "left" : tip.col > lastCol - 4 ? "right" : "center") : "center";
  const weekdayOrder = Array.from({ length: 7 }, (_, row) => (row + weekStart) % 7);
  // Any Sunday works as a base for weekday names: 2023-01-01 was a Sunday.
  const weekdayName = (weekday: number) => weekdayFmt.format(Date.UTC(2023, 0, 1 + weekday));

  return (
    <div style={{ "--hm-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      {showStats && (
        <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total", `${model.total.toLocaleString(locale)} ${model.total === 1 ? unit[0] : unit[1]}`],
            ["Active days", model.activeDays.toLocaleString(locale)],
            ["Longest streak", `${model.longest} day${model.longest === 1 ? "" : "s"}`],
            ["Current streak", `${model.current} day${model.current === 1 ? "" : "s"}`],
          ].map(([term, value]) => (
            <div key={term} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
              <dt className="text-xs text-zinc-500">{term}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-100">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex">
        {/* Weekday labels sit outside the scroller so they stay put on narrow screens. */}
        <div aria-hidden="true" className="flex w-8 shrink-0 flex-col pt-12 pr-1.5" style={{ gap: GAP }}>
          {weekdayOrder.map((weekday, row) => (
            <span key={row} className="text-right text-[10px] leading-3 text-zinc-500" style={{ height: CELL }}>
              {row % 2 === 1 ? weekdayName(weekday).slice(0, 3) : ""}
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="min-w-0 overflow-x-auto pb-2">
          <div className="relative inline-block pt-12 pr-1">
            {/* Month labels */}
            <div aria-hidden="true" className="absolute left-0 top-6 h-4 text-[11px] text-zinc-500">
              {model.monthLabels.map((m) => (
                <span key={m.col} className="absolute whitespace-nowrap" style={{ left: m.col * (CELL + GAP) }}>
                  {m.text}
                </span>
              ))}
            </div>

            <div
              role="grid"
              aria-label={label}
              aria-describedby={`${id}-legend`}
              className="flex flex-col"
              style={{ gap: GAP }}
            >
              {weekdayOrder.map((weekday, row) => (
                <div key={row} role="row" className="relative flex" style={{ gap: GAP }}>
                  <div role="rowheader" className="sr-only">
                    {weekdayName(weekday)}
                  </div>
                  {model.columns.map((column, col) => {
                    const day = column[row];
                    if (!day)
                      return <div key={col} role="gridcell" aria-hidden="true" style={{ width: CELL, height: CELL }} />;
                    const lvl = model.level(day.count);
                    const isActive = active.col === col && active.row === row;
                    return (
                      <div
                        key={col}
                        id={`${id}-${col}-${row}`}
                        role="gridcell"
                        tabIndex={isActive ? 0 : -1}
                        aria-label={describe(day)}
                        aria-selected={focus?.col === col && focus?.row === row ? true : undefined}
                        onKeyDown={onKeyDown(col, row)}
                        onFocus={() => {
                          setFocus({ col, row });
                          setTip({ col, row });
                        }}
                        onBlur={() => setTip(null)}
                        onMouseEnter={() => setTip({ col, row })}
                        onMouseLeave={() => setTip(null)}
                        onClick={() => {
                          setFocus({ col, row });
                          onSelectDay?.(day);
                        }}
                        className={[
                          "rounded-[3px] outline-offset-1 transition-transform duration-100 motion-reduce:transition-none",
                          "hover:scale-125 focus-visible:outline-2 focus-visible:outline-zinc-100",
                          onSelectDay ? "cursor-pointer" : "",
                        ].join(" ")}
                        style={{
                          width: CELL,
                          height: CELL,
                          background:
                            lvl === 0
                              ? "rgb(39 39 42 / 0.9)"
                              : `color-mix(in oklab, var(--hm-accent) ${LEVEL_MIX[lvl]}%, #18181b)`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {tip && tipDay && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 shadow-lg"
                style={{
                  top: 48 + tip.row * (CELL + GAP) - 8,
                  left: tip.col * (CELL + GAP) + CELL / 2,
                  transform: `translate(${tipAlign === "left" ? "-6px" : tipAlign === "right" ? "calc(-100% + 6px)" : "-50%"}, -100%)`,
                }}
              >
                {describe(tipDay)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div id={`${id}-legend`} className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-zinc-500">
        <span>Less</span>
        {LEVEL_MIX.map((mix, lvl) => (
          <span
            key={lvl}
            aria-hidden="true"
            className="rounded-[3px]"
            style={{
              width: CELL,
              height: CELL,
              background: lvl === 0 ? "rgb(39 39 42 / 0.9)" : `color-mix(in oklab, var(--hm-accent) ${mix}%, #18181b)`,
            }}
          />
        ))}
        <span>More</span>
        <span className="sr-only">. Use arrow keys to move between days.</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
