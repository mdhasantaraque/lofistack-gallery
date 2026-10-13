"use client";

import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export type RangeValue = [number, number];

export interface RangeSliderProps {
  /** Visible label, also used as the accessible name of both handles. */
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Controlled value. Pair with `onChange`. */
  value?: RangeValue;
  defaultValue?: RangeValue;
  /** Fires on every move. */
  onChange?: (value: RangeValue) => void;
  /** Fires once when a drag or key press finishes. Good for fetching results. */
  onChangeEnd?: (value: RangeValue) => void;
  /** Raw values (e.g. every product price). Drawn as a histogram above the track. */
  data?: number[];
  /** Number of histogram bars. */
  bins?: number;
  /** Smallest allowed gap between the two handles. */
  minDistance?: number;
  formatValue?: (value: number) => string;
  /** Any CSS color for the selected range, bars and handles. */
  accent?: string;
  /** Shows number fields for typing exact values. */
  showInputs?: boolean;
  disabled?: boolean;
  className?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

function snap(n: number, min: number, step: number) {
  const snapped = Math.round((n - min) / step) * step + min;
  // Trim float noise like 0.30000000000000004
  return Number(snapped.toFixed(10));
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  data,
  bins = 24,
  minDistance = 0,
  formatValue = (n) => n.toLocaleString(),
  accent = "#38bdf8",
  showInputs = true,
  disabled = false,
  className = "",
}: RangeSliderProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<RangeValue>(defaultValue ?? [min, max]);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const current = value ?? internal;
  // Live value during an interaction. Pointer moves can fire faster than React re-renders,
  // so handlers read and write this instead of `current`. Each interaction starts from `current`.
  const latest = useRef(current);

  const span = max - min || 1;
  const pct = (n: number) => ((n - min) / span) * 100;

  const histogram = useMemo(() => {
    if (!data?.length) return null;
    const counts = new Array<number>(bins).fill(0);
    for (const n of data) {
      if (n < min || n > max) continue;
      const i = Math.min(Math.floor(((n - min) / span) * bins), bins - 1);
      counts[i] += 1;
    }
    return { counts, peak: Math.max(...counts, 1) };
  }, [data, bins, min, max, span]);

  const inRange = useMemo(
    () => (data ? data.filter((n) => n >= current[0] && n <= current[1]).length : 0),
    [data, current],
  );

  const commit = (next: RangeValue) => {
    if (next[0] === latest.current[0] && next[1] === latest.current[1]) return;
    latest.current = next;
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  /** Moves one handle, keeping it inside the bounds and away from the other handle. */
  const moveThumb = (thumb: 0 | 1, raw: number) => {
    const [lo, hi] = latest.current;
    const n = snap(raw, min, step);
    const next: RangeValue =
      thumb === 0 ? [clamp(n, min, hi - minDistance), hi] : [lo, clamp(n, lo + minDistance, max)];
    commit(next);
  };

  const valueFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * span;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    // Stops the follow-up mousedown from moving focus away from the handle we focus below.
    e.preventDefault();
    latest.current = current;
    const raw = valueFromPointer(e.clientX);
    const [lo, hi] = latest.current;
    // Grab whichever handle is closer. On a tie, pick the side the pointer is on.
    const thumb: 0 | 1 = Math.abs(raw - lo) < Math.abs(raw - hi) || (lo === hi && raw < lo) ? 0 : 1;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(thumb);
    moveThumb(thumb, raw);
    document.getElementById(`${id}-thumb-${thumb}`)?.focus({ preventScroll: true });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (active === null) return;
    moveThumb(active, valueFromPointer(e.clientX));
  };

  const endDrag = () => {
    if (active === null) return;
    setActive(null);
    onChangeEnd?.(latest.current);
  };

  const onThumbKeyDown = (thumb: 0 | 1) => (e: KeyboardEvent<HTMLDivElement>) => {
    latest.current = current;
    const big = Math.max(step, (max - min) / 10);
    const v = current[thumb];
    const moves: Record<string, number> = {
      ArrowRight: v + step,
      ArrowUp: v + step,
      ArrowLeft: v - step,
      ArrowDown: v - step,
      PageUp: v + big,
      PageDown: v - big,
      Home: min,
      End: max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    moveThumb(thumb, moves[e.key]);
    onChangeEnd?.(latest.current);
  };

  const onInputCommit = (thumb: 0 | 1, text: string) => {
    const n = Number(text);
    if (text.trim() === "" || Number.isNaN(n)) return;
    latest.current = current;
    moveThumb(thumb, n);
    onChangeEnd?.(latest.current);
  };

  const thumbClasses = [
    "absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--rs-accent)] bg-zinc-950",
    "shadow-[0_0_0_4px_rgb(0_0_0/0.25)] transition-[box-shadow,transform] duration-150 motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_6px_color-mix(in_oklab,var(--rs-accent)_35%,transparent)]",
    disabled ? "cursor-not-allowed" : "cursor-grab hover:scale-110 active:cursor-grabbing",
  ].join(" ");

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      style={{ "--rs-accent": accent } as CSSProperties}
      className={["w-full select-none", disabled ? "opacity-50" : "", className].join(" ")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-medium text-zinc-200">
          {label}
        </span>
        <span className="text-sm tabular-nums text-zinc-400">
          {formatValue(current[0])} – {formatValue(current[1])}
        </span>
      </div>

      {histogram && (
        <div className="mt-4 flex h-20 items-end gap-[2px]" aria-hidden="true">
          {histogram.counts.map((count, i) => {
            const binStart = min + (i / bins) * span;
            const binEnd = min + ((i + 1) / bins) * span;
            const selected = binEnd > current[0] && binStart < current[1];
            return (
              <div
                key={i}
                className={[
                  "flex-1 rounded-t-sm transition-[background-color,height] duration-200 motion-reduce:transition-none",
                  selected ? "bg-[var(--rs-accent)]" : "bg-zinc-700/60",
                ].join(" ")}
                style={{ height: `${Math.max((count / histogram.peak) * 100, count > 0 ? 6 : 2)}%` }}
              />
            );
          })}
        </div>
      )}

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={["relative h-8 touch-none", histogram ? "" : "mt-3", disabled ? "" : "cursor-pointer"].join(" ")}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-800" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--rs-accent)]"
          style={{ left: `${pct(current[0])}%`, width: `${pct(current[1]) - pct(current[0])}%` }}
        />
        {([0, 1] as const).map((thumb) => (
          <div
            key={thumb}
            id={`${id}-thumb-${thumb}`}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${label}, ${thumb === 0 ? "minimum" : "maximum"}`}
            aria-valuemin={thumb === 0 ? min : current[0] + minDistance}
            aria-valuemax={thumb === 0 ? current[1] - minDistance : max}
            aria-valuenow={current[thumb]}
            aria-valuetext={formatValue(current[thumb])}
            aria-disabled={disabled || undefined}
            onKeyDown={disabled ? undefined : onThumbKeyDown(thumb)}
            className={[thumbClasses, active === thumb ? "scale-110" : "", thumb === 1 ? "z-10" : ""].join(" ")}
            style={{ left: `${pct(current[thumb])}%` }}
          />
        ))}
      </div>

      {(showInputs || data) && (
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          {showInputs && (
            <div className="flex items-end gap-2">
              {([0, 1] as const).map((thumb) => (
                <label key={thumb} className="flex flex-col gap-1 text-xs text-zinc-500">
                  {thumb === 0 ? "Min" : "Max"}
                  <input
                    // Remount when the value changes elsewhere so the field shows it
                    key={current[thumb]}
                    type="number"
                    inputMode="decimal"
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    defaultValue={current[thumb]}
                    onBlur={(e) => onInputCommit(thumb, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onInputCommit(thumb, e.currentTarget.value)}
                    className="h-9 w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-sm tabular-nums text-zinc-100 focus-visible:border-[var(--rs-accent)] focus-visible:outline-none disabled:cursor-not-allowed"
                  />
                </label>
              ))}
            </div>
          )}
          {data && (
            <p className="text-sm text-zinc-400" aria-live="polite">
              <span className="font-semibold tabular-nums text-zinc-100">{inRange.toLocaleString()}</span> of{" "}
              {data.length.toLocaleString()} in range
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RangeSlider;
