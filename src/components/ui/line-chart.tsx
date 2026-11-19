"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export interface LinePoint {
  /** X value, usually a YYYY-MM-DD date. Every series must use the same x values in the same order. */
  x: string;
  y: number;
}

export interface LineSeries {
  id: string;
  label: string;
  /** Any CSS color. Falls back to the palette. */
  color?: string;
  data: LinePoint[];
}

export interface LineChartProps {
  series: LineSeries[];
  /** Accessible name and caption of the data table. */
  title: string;
  height?: number;
  formatY?: (n: number) => string;
  formatX?: (x: string) => string;
  /** Shade the area under the first visible series. */
  area?: boolean;
  className?: string;
}

const PALETTE = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];
const PAD = { top: 12, right: 12, bottom: 28, left: 48 };

/** Rounds the top of the axis up to 1, 2 or 5 × a power of ten, giving clean tick labels. */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: 1, step: 0.25 };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  return { top: Math.ceil(max / step) * step, step };
}

const defaultX = (x: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(x)
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
        Date.parse(`${x}T00:00:00Z`),
      )
    : x;

export function LineChart({
  series,
  title,
  height = 260,
  formatY = (n) => n.toLocaleString(),
  formatX = defaultX,
  area = true,
  className = "",
}: LineChartProps) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  // Measure the real width so text and strokes are never stretched.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const colored = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? PALETTE[i % PALETTE.length] })),
    [series],
  );
  const visible = colored.filter((s) => !hidden.has(s.id));
  const xs = colored[0]?.data.map((p) => p.x) ?? [];
  const n = xs.length;

  const max = Math.max(0, ...visible.flatMap((s) => s.data.map((p) => p.y)));
  const { top, step } = niceScale(max);
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const xAt = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  // About one x label per 110px, always including the first and last point.
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 110))));

  const pathFor = (s: (typeof colored)[number]) =>
    s.data.map((p, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join("");

  const pickIndex = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - rect.left) / rect.width;
    setKeyboard(false);
    setActive(Math.min(n - 1, Math.max(0, Math.round(t * (n - 1)))));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? n - 1;
    const next =
      e.key === "ArrowLeft"
        ? cur - 1
        : e.key === "ArrowRight"
          ? cur + 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (e.key === "Escape") return setActive(null);
    if (next === null) return;
    e.preventDefault();
    setKeyboard(true);
    setActive(Math.min(n - 1, Math.max(0, next)));
  };

  const toggle = (sid: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });

  const describe = (i: number) =>
    `${formatX(xs[i])}: ${visible.map((s) => `${s.label} ${formatY(s.data[i]?.y ?? 0)}`).join(", ")}`;

  const tipLeft = active !== null ? xAt(active) : 0;
  const tipFlip = tipLeft > width * 0.6;

  return (
    <figure className={["w-full", className].join(" ")}>
      <ul className="mb-3 flex flex-wrap gap-2" role="list" aria-label="Series">
        {colored.map((s) => {
          const off = hidden.has(s.id);
          const first = s.data[0]?.y ?? 0;
          const last = s.data[n - 1]?.y ?? 0;
          const change = first ? ((last - first) / first) * 100 : 0;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={!off}
                onClick={() => toggle(s.id)}
                style={{ "--lc-color": s.color } as CSSProperties}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lc-color)]",
                  off ? "border-zinc-800 text-zinc-500" : "border-zinc-700 text-zinc-200 hover:bg-zinc-900",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={["h-0.5 w-4 rounded-full", off ? "bg-zinc-600" : "bg-[var(--lc-color)]"].join(" ")}
                />
                <span className={off ? "line-through" : ""}>{s.label}</span>
                <span className="tabular-nums text-zinc-400">{formatY(last)}</span>
                <span className={["text-xs tabular-nums", change >= 0 ? "text-emerald-400" : "text-red-400"].join(" ")}>
                  {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        ref={wrapRef}
        tabIndex={0}
        role="group"
        aria-label={`${title}. Use left and right arrow keys to read values.`}
        onKeyDown={onKey}
        onFocus={() => {
          if (active === null && n) {
            setKeyboard(true);
            setActive(n - 1);
          }
        }}
        onBlur={() => keyboard && setActive(null)}
        className="relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        <svg width={width} height={height} className="block max-w-full" aria-hidden="true">
          <defs>
            {visible[0] && (
              <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={visible[0].color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={visible[0].color} stopOpacity="0" />
              </linearGradient>
            )}
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="rgb(39 39 42)"
                strokeDasharray={t ? "3 4" : undefined}
              />
              <text
                x={PAD.left - 8}
                y={yAt(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-zinc-500 text-[11px] tabular-nums"
              >
                {formatY(t)}
              </text>
            </g>
          ))}
          {xs.map((x, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              // Skip a regular label that would collide with the always-shown last one.
              i !== n - 1 && n - 1 - i < labelEvery / 2 ? null : (
                <text
                  key={x}
                  x={xAt(i)}
                  y={height - 8}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                  className="fill-zinc-500 text-[11px]"
                >
                  {formatX(x)}
                </text>
              )
            ) : null,
          )}

          {area && visible[0] && n > 1 && (
            <path d={`${pathFor(visible[0])}L${xAt(n - 1)},${yAt(0)}L${xAt(0)},${yAt(0)}Z`} fill={`url(#${id}-fill)`} />
          )}
          {visible.map((s) => (
            <path
              key={s.id}
              d={pathFor(s)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {active !== null && (
            <g>
              <line
                x1={xAt(active)}
                x2={xAt(active)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="rgb(113 113 122)"
                strokeDasharray="3 3"
              />
              {visible.map((s) => (
                <circle
                  key={s.id}
                  cx={xAt(active)}
                  cy={yAt(s.data[active]?.y ?? 0)}
                  r="4.5"
                  fill="#09090b"
                  stroke={s.color}
                  strokeWidth="2.5"
                />
              ))}
            </g>
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={pickIndex}
            onPointerDown={pickIndex}
            onPointerLeave={() => !keyboard && setActive(null)}
            className="cursor-crosshair"
          />
        </svg>

        {active !== null && visible.length > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl"
            style={{ left: tipLeft, transform: tipFlip ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
          >
            <p className="mb-1 font-medium text-zinc-300">{formatX(xs[active])}</p>
            {visible.map((s) => (
              <p key={s.id} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums text-zinc-50">{formatY(s.data[active]?.y ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
        {visible.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-sm text-zinc-500">All series are hidden.</p>
        )}
        <p className="sr-only" aria-live="polite">
          {keyboard && active !== null && visible.length ? describe(active) : ""}
        </p>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {colored.map((s) => (
              <th key={s.id} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((x, i) => (
            <tr key={x}>
              <th scope="row">{formatX(x)}</th>
              {colored.map((s) => (
                <td key={s.id}>{formatY(s.data[i]?.y ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default LineChart;
