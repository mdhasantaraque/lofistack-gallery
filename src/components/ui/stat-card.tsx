"use client";

import { useId, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export interface StatPeriod {
  id: string;
  /** Button text, e.g. "7D". */
  label: string;
  /** Spoken and shown in the comparison, e.g. "previous 7 days". */
  compareLabel: string;
  value: number;
  previous: number;
  /** Points for the sparkline, oldest first. */
  series: number[];
  /** Name of each point, e.g. dates. Defaults to "Point 3 of 30". */
  pointLabels?: string[];
}

export interface StatCardProps {
  label: string;
  periods: StatPeriod[];
  defaultPeriod?: string;
  /** Formats the big number, the sparkline readout and the target. */
  format?: (n: number) => string;
  /** For metrics like churn or response time, a drop is the good news. */
  goodWhen?: "up" | "down";
  /** Changes smaller than this (in %) are shown as flat. */
  flatBelow?: number;
  /** Optional goal, shown as a progress bar. */
  target?: number;
  icon?: ReactNode;
  loading?: boolean;
  accent?: string;
  className?: string;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const W = 200;
const H = 48;

export function StatCard({
  label,
  periods,
  defaultPeriod,
  format = (n) => compact.format(n),
  goodWhen = "up",
  flatBelow = 0.5,
  target,
  icon,
  loading = false,
  accent = "#a78bfa",
  className = "",
}: StatCardProps) {
  const id = useId();
  const [periodId, setPeriodId] = useState(defaultPeriod ?? periods[0]?.id);
  const [point, setPoint] = useState<number | null>(null);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];

  if (!period) return null;

  const { value, previous, series } = period;
  const change = previous === 0 ? null : ((value - previous) / Math.abs(previous)) * 100;
  const trend = change === null ? "new" : Math.abs(change) < flatBelow ? "flat" : change > 0 ? "up" : "down";
  const good = trend === "flat" || trend === "new" ? null : trend === goodWhen;
  const tone =
    good === null
      ? "bg-zinc-800 text-zinc-300"
      : good
        ? "bg-emerald-400/15 text-emerald-300"
        : "bg-rose-400/15 text-rose-300";
  const changeText =
    change === null ? "New" : `${trend === "flat" ? "" : change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}%`;
  const spoken =
    change === null
      ? `No data for the ${period.compareLabel}.`
      : trend === "flat"
        ? `About the same as the ${period.compareLabel}.`
        : `${trend === "up" ? "Up" : "Down"} ${Math.abs(change).toFixed(1)}% from the ${period.compareLabel}, ${good ? "good" : "needs attention"}.`;

  // Sparkline geometry in a fixed viewBox that stretches to the card width.
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const n = series.length;
  const xAt = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const line = series.map((v, i) => `${i ? "L" : "M"}${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  const active = point !== null && point < n ? point : null;
  const pointName = (i: number) => period.pointLabels?.[i] ?? `Point ${i + 1} of ${n}`;
  const lineColor = good === false ? "#fb7185" : accent;

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setPoint(Math.round(ratio * (n - 1)));
  };

  const onSparkKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? n - 1;
    const keys: Record<string, number> = {
      ArrowRight: cur + 1,
      ArrowUp: cur + 1,
      ArrowLeft: cur - 1,
      ArrowDown: cur - 1,
      Home: 0,
      End: n - 1,
      PageUp: cur + 7,
      PageDown: cur - 7,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    setPoint(Math.min(Math.max(keys[e.key], 0), n - 1));
  };

  const progress = target ? Math.min(value / target, 1) : 0;

  return (
    <article
      aria-labelledby={`${id}-label`}
      aria-busy={loading || undefined}
      style={{ "--sc-accent": accent, "--sc-line": lineColor } as CSSProperties}
      className={[
        "relative flex w-full min-w-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-300"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <h3 id={`${id}-label`} className="truncate text-sm font-medium text-zinc-400">
            {label}
          </h3>
        </div>
        {periods.length > 1 && (
          <fieldset className="flex shrink-0 rounded-lg bg-zinc-800/80 p-0.5" disabled={loading}>
            <legend className="sr-only">Period for {label}</legend>
            {periods.map((p) => (
              <label
                key={p.id}
                className="cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-100 has-[:checked]:bg-zinc-950 has-[:checked]:text-zinc-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--sc-accent)]"
              >
                <input
                  type="radio"
                  name={`${id}-period`}
                  value={p.id}
                  checked={p.id === period.id}
                  onChange={() => {
                    setPeriodId(p.id);
                    setPoint(null);
                  }}
                  className="sr-only"
                />
                {p.label}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {loading ? (
        <div className="mt-3 animate-pulse space-y-3 motion-reduce:animate-none" aria-hidden="true">
          <div className="h-8 w-32 rounded-md bg-zinc-800" />
          <div className="h-4 w-40 rounded bg-zinc-800" />
          <div className="h-12 rounded-md bg-zinc-800/70" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums">{format(value)}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${tone}`}>
              {trend === "up" && <span aria-hidden="true">↑</span>}
              {trend === "down" && <span aria-hidden="true">↓</span>}
              <span aria-hidden="true">{changeText}</span>
              <span className="sr-only">{spoken}</span>
            </span>
            <span aria-hidden="true">vs {period.compareLabel}</span>
          </p>

          {n > 1 && (
            <div className="mt-4">
              <div
                role="slider"
                tabIndex={0}
                aria-label={`${label} trend, ${period.compareLabel.replace(/^previous /, "last ")}`}
                aria-valuemin={1}
                aria-valuemax={n}
                aria-valuenow={(active ?? n - 1) + 1}
                aria-valuetext={`${pointName(active ?? n - 1)}: ${format(series[active ?? n - 1])}`}
                onKeyDown={onSparkKey}
                onPointerMove={pick}
                onPointerDown={pick}
                onPointerLeave={() => setPoint(null)}
                onBlur={() => setPoint(null)}
                className="relative h-12 touch-pan-y rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900"
              >
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  className="size-full overflow-visible"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--sc-line)" stopOpacity="0.3" />
                      <stop offset="1" stopColor="var(--sc-line)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill={`url(#${id}-fill)`} />
                  <path
                    d={line}
                    fill="none"
                    stroke="var(--sc-line)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {/* Marker in HTML so it stays round however the SVG is stretched. */}
                {active !== null && (
                  <>
                    <span
                      className="pointer-events-none absolute inset-y-0 w-px bg-zinc-600"
                      style={{ left: `${(xAt(active) / W) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span
                      className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-[var(--sc-line)]"
                      style={{ left: `${(xAt(active) / W) * 100}%`, top: `${(yAt(series[active]) / H) * 100}%` }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </div>
              <p className="mt-1.5 flex justify-between gap-2 text-[11px] text-zinc-500" aria-hidden="true">
                {active !== null ? (
                  <>
                    <span className="truncate">{pointName(active)}</span>
                    <span className="shrink-0 font-medium text-zinc-200 tabular-nums">{format(series[active])}</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{pointName(0)}</span>
                    <span className="truncate">{pointName(n - 1)}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {target !== undefined && target > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Goal {format(target)}</span>
                <span className="tabular-nums text-zinc-300">{Math.round((value / target) * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${label} goal`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-valuetext={`${format(value)} of ${format(target)}`}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800"
              >
                <div
                  className="h-full rounded-full bg-[var(--sc-accent)] transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default StatCard;
