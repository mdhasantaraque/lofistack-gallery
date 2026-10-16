"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

export interface DonutDatum {
  id: string;
  label: string;
  value: number;
  /** Any CSS color. Falls back to the built-in palette. */
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  /** Chart title, also the caption of the screen reader table. */
  title: string;
  formatValue?: (value: number) => string;
  /** Shown in the middle when nothing is hovered. */
  totalLabel?: string;
  /** Diameter in px. The chart scales down to fit narrow containers. */
  size?: number;
  /** Ring width in px. */
  thickness?: number;
  /** Largest slice first, starting at 12 o'clock. */
  sortByValue?: boolean;
  /** Ids hidden on first render. */
  defaultHidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
  className?: string;
}

// Picked to stay apart from each other on a dark background, including for common color blindness.
const PALETTE = ["#818cf8", "#34d399", "#fbbf24", "#f472b6", "#38bdf8", "#fb923c", "#a3e635", "#c084fc"];
const GAP = 1.2; // gap between slices, in % of the circle

export function DonutChart({
  data,
  title,
  formatValue = (v) => v.toLocaleString(),
  totalLabel = "Total",
  size = 240,
  thickness = 28,
  sortByValue = true,
  defaultHidden = [],
  onHiddenChange,
  className = "",
}: DonutChartProps) {
  const id = useId();
  const [hidden, setHidden] = useState<Set<string>>(new Set(defaultHidden));
  const [hover, setHover] = useState<string | null>(null);

  const items = useMemo(() => {
    const colored = data.map((d, i) => ({ ...d, color: d.color ?? PALETTE[i % PALETTE.length] }));
    return sortByValue ? [...colored].sort((a, b) => b.value - a.value) : colored;
  }, [data, sortByValue]);

  const total = items.reduce((sum, d) => sum + (hidden.has(d.id) ? 0 : Math.max(d.value, 0)), 0);
  const visibleCount = items.filter((d) => !hidden.has(d.id) && d.value > 0).length;

  // Every slice is a circle stroke. Its dash length is its share and its offset is where it starts,
  // so showing or hiding a series animates with a plain CSS transition.
  const radius = 50 - (thickness / size) * 50;
  const circumference = 2 * Math.PI * radius;
  const shares = items.map((d) => (hidden.has(d.id) || total === 0 ? 0 : Math.max(d.value, 0) / total));
  const slices = items.map((d, i) => {
    const pct = shares[i] * 100;
    const start = shares.slice(0, i).reduce((sum, s) => sum + s, 0) * 100;
    const gap = visibleCount > 1 && pct > 0 ? Math.min(GAP, pct / 2) : 0;
    return {
      ...d,
      share: shares[i],
      dash: Math.max(((pct - gap) / 100) * circumference, 0),
      offset: -(start / 100) * circumference,
    };
  });

  // Functional update so fast repeated clicks never work from a stale set.
  const toggle = (sid: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
    if (!hidden.has(sid) && hover === sid) setHover(null);
  };

  // Report changes after they're committed, not from inside the state updater.
  const reported = useRef(hidden);
  const onHiddenRef = useRef(onHiddenChange);
  useEffect(() => {
    onHiddenRef.current = onHiddenChange;
  });
  useEffect(() => {
    if (reported.current === hidden) return;
    reported.current = hidden;
    onHiddenRef.current?.([...hidden]);
  }, [hidden]);

  const focus = hover ? slices.find((s) => s.id === hover && s.share > 0) : null;
  const pct = (share: number) => `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;
  const strokeWidth = (thickness / size) * 100;

  return (
    <figure
      className={["flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10", className].join(" ")}
    >
      <div className="relative shrink-0" style={{ width: `min(${size}px, 100%)`, aspectRatio: "1" }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90 overflow-visible" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(39 39 42)" strokeWidth={strokeWidth} />
          {slices.map((s) => {
            const dimmed = hover !== null && hover !== s.id;
            return (
              <circle
                key={s.id}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === s.id ? strokeWidth * 1.25 : strokeWidth}
                strokeDasharray={`${s.dash} ${circumference}`}
                strokeDashoffset={s.offset}
                onPointerEnter={() => s.share > 0 && setHover(s.id)}
                onPointerLeave={() => setHover(null)}
                className="cursor-pointer transition-[stroke-dasharray,stroke-dashoffset,stroke-width,opacity] duration-500 ease-out motion-reduce:transition-none"
                style={{ opacity: dimmed ? 0.35 : 1 }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center" aria-live="polite">
          <div className="max-w-[60%]">
            <p className="truncate text-xs text-zinc-400">{focus ? focus.label : totalLabel}</p>
            <p className="text-2xl font-bold tabular-nums text-zinc-50 sm:text-3xl">
              {focus ? formatValue(focus.value) : total > 0 ? formatValue(total) : "–"}
            </p>
            <p className="text-xs tabular-nums text-zinc-500">
              {focus ? pct(focus.share) : total > 0 ? `${visibleCount} of ${items.length} shown` : "Nothing shown"}
            </p>
          </div>
        </div>
      </div>

      <figcaption className="w-full min-w-0 sm:max-w-xs">
        <p id={`${id}-title`} className="font-semibold text-zinc-50">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">Click a series to hide or show it.</p>
        <ul className="mt-3 space-y-1" role="list" aria-labelledby={`${id}-title`}>
          {slices.map((s) => {
            const off = hidden.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={!off}
                  onClick={() => toggle(s.id)}
                  onPointerEnter={() => !off && setHover(s.id)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => !off && setHover(s.id)}
                  onBlur={() => setHover(null)}
                  style={{ "--dc-color": s.color } as CSSProperties}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-color)]",
                    hover === s.id ? "bg-zinc-800/80" : "hover:bg-zinc-900",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "size-3 shrink-0 rounded-sm border-2 border-[var(--dc-color)] transition-colors",
                      off ? "bg-transparent" : "bg-[var(--dc-color)]",
                    ].join(" ")}
                  />
                  <span
                    className={["min-w-0 flex-1 truncate", off ? "text-zinc-500 line-through" : "text-zinc-200"].join(
                      " ",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="tabular-nums text-zinc-400">{formatValue(s.value)}</span>
                  <span className="w-12 text-right tabular-nums text-zinc-500">{off ? "off" : pct(s.share)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </figcaption>

      {/* Same numbers as a real table for screen readers. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th scope="col">Value</th>
            <th scope="col">Share of shown total</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((s) => (
            <tr key={s.id}>
              <th scope="row">{s.label}</th>
              <td>{formatValue(s.value)}</td>
              <td>{hidden.has(s.id) ? "Hidden" : pct(s.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default DonutChart;
