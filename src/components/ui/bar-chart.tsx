"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export interface BarSeries {
  id: string;
  label: string;
  /** One value per category, in the same order as categories. */
  values: number[];
  color?: string;
}

export type BarLayout = "stacked" | "grouped" | "percent";

export interface BarChartProps {
  /** Labels along the bottom, e.g. months. */
  categories: string[];
  series: BarSeries[];
  /** Accessible name of the chart and caption of its data table. */
  title: string;
  defaultLayout?: BarLayout;
  onLayoutChange?: (layout: BarLayout) => void;
  /** Series ids hidden on first render. */
  defaultHidden?: string[];
  /** Plot height in px. Width follows the container. */
  height?: number;
  formatValue?: (n: number) => string;
  accent?: string;
  className?: string;
}

const PALETTE = ["#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#fb923c"];
const LAYOUTS: { id: BarLayout; label: string }[] = [
  { id: "stacked", label: "Stacked" },
  { id: "grouped", label: "Grouped" },
  { id: "percent", label: "100%" },
];
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Rounds the axis up to a friendly number and returns evenly spaced ticks from 0. */
function niceTicks(max: number, target = 4) {
  if (max <= 0) return [0, 1];
  const rough = max / target;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

const pct = (n: number) => `${Math.round(n)}%`;

export function BarChart({
  categories,
  series,
  title,
  defaultLayout = "stacked",
  onLayoutChange,
  defaultHidden = [],
  height = 260,
  formatValue = (n) => compact.format(n),
  accent = "#a78bfa",
  className = "",
}: BarChartProps) {
  const id = useId();
  const bars = useRef<(HTMLButtonElement | null)[]>([]);
  const [layout, setLayout] = useState<BarLayout>(defaultLayout);
  const [hidden, setHidden] = useState<string[]>(defaultHidden);
  const [activeRaw, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [notice, setNotice] = useState("");

  const colored = series.map((s, i) => ({ ...s, color: s.color ?? PALETTE[i % PALETTE.length] }));
  const visible = colored.filter((s) => !hidden.includes(s.id));
  const count = categories.length;
  // Stays valid if the data shrinks, so one bar is always reachable with Tab.
  const active = Math.min(activeRaw, Math.max(count - 1, 0));

  const totals = categories.map((_, c) => visible.reduce((sum, s) => sum + (s.values[c] ?? 0), 0));
  const maxValue =
    layout === "grouped"
      ? Math.max(0, ...visible.flatMap((s) => s.values))
      : layout === "stacked"
        ? Math.max(0, ...totals)
        : 100;
  const ticks = layout === "percent" ? [0, 25, 50, 75, 100] : niceTicks(maxValue);
  const top = ticks[ticks.length - 1];
  const tickLabel = (t: number) => (layout === "percent" ? pct(t) : formatValue(t));
  const longestTick = ticks.map(tickLabel).reduce((a, b) => (b.length > a.length ? b : a), "");

  // Hidden series stay in the stack with a value of 0, so toggling one animates instead of jumping.
  const shown = (s: BarSeries, c: number) => (hidden.includes(s.id) ? 0 : (s.values[c] ?? 0));
  const share = (v: number, c: number) => (totals[c] ? (v / totals[c]) * 100 : 0);

  const toggleSeries = (sid: string) => {
    // Work from the latest list, so quick clicks on several items don't overwrite each other.
    setHidden((prev) => {
      if (prev.includes(sid)) return prev.filter((h) => h !== sid);
      const stillVisible = series.filter((s) => !prev.includes(s.id)).length;
      return stillVisible > 1 ? [...prev, sid] : prev;
    });
    setNotice(!hidden.includes(sid) && visible.length === 1 ? "At least one series stays visible." : "");
  };

  const chooseLayout = (next: BarLayout) => {
    setLayout(next);
    onLayoutChange?.(next);
  };

  const describe = (c: number) => {
    const parts = visible.map((s) => {
      const v = s.values[c] ?? 0;
      return layout === "percent"
        ? `${s.label} ${formatValue(v)} (${pct(share(v, c))})`
        : `${s.label} ${formatValue(v)}`;
    });
    return `${categories[c]}: ${parts.join(", ")}. Total ${formatValue(totals[c])}.`;
  };

  const focusBar = (c: number) => {
    const next = Math.min(Math.max(c, 0), count - 1);
    setActive(next);
    setKeyboard(true);
    bars.current[next]?.focus();
  };

  const onBarKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active + 1,
      ArrowDown: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (e.key === "Escape") {
      setKeyboard(false);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    focusBar(moves[e.key]);
  };

  // The tooltip follows the mouse, or the focused bar when using the keyboard.
  const tip = hovered ?? (keyboard ? active : null);

  return (
    <figure
      aria-labelledby={`${id}-title`}
      style={{ "--bc-accent": accent } as CSSProperties}
      className={["relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5", className].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption id={`${id}-title`} className="text-base font-semibold text-zinc-50">
          {title}
        </figcaption>
        <fieldset className="flex rounded-lg bg-zinc-800/80 p-0.5">
          <legend className="sr-only">Bar layout</legend>
          {LAYOUTS.map((l) => (
            <label
              key={l.id}
              className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100 has-[:checked]:bg-zinc-950 has-[:checked]:text-zinc-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--bc-accent)]"
            >
              <input
                type="radio"
                name={`${id}-layout`}
                value={l.id}
                checked={layout === l.id}
                onChange={() => chooseLayout(l.id)}
                className="sr-only"
              />
              {l.label}
            </label>
          ))}
        </fieldset>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Series">
        {colored.map((s) => {
          const on = !hidden.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggleSeries(s.id)}
                className={[
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent)]",
                  on ? "border-zinc-700 text-zinc-200" : "border-zinc-800 text-zinc-500 line-through",
                ].join(" ")}
              >
                <span
                  className="size-2.5 rounded-sm transition-opacity"
                  style={{ background: s.color, opacity: on ? 1 : 0.3 }}
                  aria-hidden="true"
                />
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>

      <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {/* Y axis. The invisible copy of the longest label sets the column width. */}
        <div
          className="relative text-right text-[11px] tabular-nums text-zinc-500"
          style={{ height }}
          aria-hidden="true"
        >
          <span className="invisible block">{longestTick}</span>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {tickLabel(t)}
            </span>
          ))}
        </div>

        <div className="relative" style={{ height }} onPointerLeave={() => setHovered(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              className={[
                "absolute inset-x-0 border-t",
                t === 0 ? "border-zinc-600" : "border-dashed border-zinc-800",
              ].join(" ")}
              style={{ bottom: `${(t / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          <div
            className="absolute inset-0 flex"
            role="group"
            aria-label={`${title} bars. Use the arrow keys to move between them.`}
          >
            {categories.map((cat, c) => (
              <button
                key={cat}
                ref={(el) => {
                  bars.current[c] = el;
                }}
                type="button"
                tabIndex={c === active ? 0 : -1}
                aria-label={describe(c)}
                onKeyDown={onBarKey}
                onFocus={() => setActive(c)}
                onClick={() => {
                  setActive(c);
                  setKeyboard(true);
                }}
                onBlur={() => setKeyboard(false)}
                onPointerEnter={() => setHovered(c)}
                className={[
                  "group relative flex h-full min-w-0 flex-1 items-end justify-center px-0.5 focus-visible:outline-none",
                  tip === c ? "bg-zinc-800/40" : "",
                ].join(" ")}
              >
                {layout === "grouped" ? (
                  <span className="flex h-full w-[80%] max-w-24 items-end gap-px sm:gap-0.5">
                    {visible.map((s) => (
                      <span
                        key={s.id}
                        className="min-w-0 flex-1 rounded-t-[3px] transition-[height] duration-300 ease-out motion-reduce:transition-none"
                        style={{ height: `${((s.values[c] ?? 0) / top) * 100}%`, background: s.color }}
                      />
                    ))}
                  </span>
                ) : (
                  <span
                    className="flex w-[62%] max-w-14 flex-col-reverse overflow-hidden rounded-t-md transition-[height] duration-300 ease-out motion-reduce:transition-none"
                    style={{ height: `${layout === "percent" ? (totals[c] ? 100 : 0) : (totals[c] / top) * 100}%` }}
                  >
                    {colored.map((s) => (
                      <span
                        key={s.id}
                        className="w-full shrink-0 transition-[height] duration-300 ease-out motion-reduce:transition-none"
                        style={{ height: `${share(shown(s, c), c)}%`, background: s.color }}
                      />
                    ))}
                  </span>
                )}
                <span
                  className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset ring-transparent group-focus-visible:ring-[var(--bc-accent)]"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          {tip !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-zinc-700 bg-zinc-950/95 p-2.5 text-xs shadow-xl backdrop-blur"
              // Centered over the bar, but never past either edge of the plot.
              style={{ left: `clamp(0px, calc(${((tip + 0.5) / count) * 100}% - 5.5rem), calc(100% - 11rem))` }}
              aria-hidden="true"
            >
              <p className="font-medium text-zinc-100">{categories[tip]}</p>
              <ul className="mt-1.5 space-y-1">
                {visible.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-zinc-300">
                    <span className="size-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    <span className="tabular-nums text-zinc-100">
                      {layout === "percent" ? pct(share(s.values[tip] ?? 0, tip)) : formatValue(s.values[tip] ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 flex justify-between border-t border-zinc-800 pt-1.5 text-zinc-400">
                <span>Total</span>
                <span className="tabular-nums text-zinc-100">{formatValue(totals[tip])}</span>
              </p>
            </div>
          )}
        </div>

        <div />
        <div className="mt-2 flex" aria-hidden="true">
          {categories.map((cat) => (
            <span key={cat} className="min-w-0 flex-1 truncate text-center text-[10px] sm:text-[11px] text-zinc-500">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* A table can't shrink below its content, so sr-only on the table itself would still widen
          the page on phones. The wrapper is what gets clipped to 1px. */}
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              {visible.map((s) => (
                <th key={s.id} scope="col">
                  {s.label}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, c) => (
              <tr key={cat}>
                <th scope="row">{cat}</th>
                {visible.map((s) => (
                  <td key={s.id}>{formatValue(s.values[c] ?? 0)}</td>
                ))}
                <td>{formatValue(totals[c])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default BarChart;
