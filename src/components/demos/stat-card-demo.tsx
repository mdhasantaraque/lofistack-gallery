"use client";

import { useState } from "react";
import { StatCard, type StatPeriod } from "@/components/ui/stat-card";

/** Deterministic made-up data, so the server and the browser render the same numbers. */
function makeSeries(length: number, start: number, drift: number, noise: number, seed: number) {
  return Array.from({ length }, (_, i) =>
    Math.max(0, start + drift * i + Math.sin(i * 1.7 + seed) * noise + Math.cos(i * 0.6 + seed * 2) * noise * 0.6),
  );
}

const END = new Date(Date.UTC(2026, 10, 22));
const dayLabel = (daysBack: number) =>
  new Date(END.getTime() - daysBack * 86_400_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function periods(start: number, drift: number, noise: number, seed: number, sum: boolean): StatPeriod[] {
  return [7, 30, 90].map((days) => {
    const series = makeSeries(days, start, drift * (30 / days), noise, seed);
    const before = makeSeries(days, start - drift * 8, drift * (30 / days), noise, seed + 3);
    const total = (s: number[]) => (sum ? s.reduce((a, b) => a + b, 0) : s[s.length - 1]);
    return {
      id: `${days}d`,
      label: `${days}D`,
      compareLabel: `previous ${days} days`,
      value: total(series),
      previous: total(before),
      series,
      pointLabels: series.map((_, i) => dayLabel(days - 1 - i)),
    };
  });
}

// minimumFractionDigits is set on purpose: without it, Node on the server printed "$80.0K" while the
// browser printed "$80K", and React reported a hydration mismatch.
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const svg = (d: string) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function StatCardDemo() {
  const [loading, setLoading] = useState(false);

  const reload = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="w-full max-w-4xl space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Revenue"
          icon={svg("M10 3v14M13.5 6H8.25a2.25 2.25 0 0 0 0 4.5h3.5a2.25 2.25 0 0 1 0 4.5H6")}
          periods={periods(1500, 18, 220, 1, true)}
          defaultPeriod="30d"
          format={(n) => usd.format(n)}
          target={80_000}
          loading={loading}
        />
        <StatCard
          label="Churn rate"
          icon={svg("M4 6l5 5 3-3 4 4M12 12h4v-4")}
          periods={periods(3.2, -0.03, 0.25, 4, false)}
          defaultPeriod="30d"
          format={(n) => `${n.toFixed(2)}%`}
          goodWhen="down"
          loading={loading}
          accent="#38bdf8"
        />
        <StatCard
          label="Active users"
          icon={svg(
            "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4 8a4 4 0 0 1 8 0M13 4a3 3 0 0 1 0 5.5M15 17a4 4 0 0 0-2.5-3.7",
          )}
          periods={periods(3900, -4, 160, 7, false)}
          defaultPeriod="30d"
          loading={loading}
          accent="#34d399"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Reload data"}
        </button>
        <p className="text-xs text-zinc-500">
          Hover or drag along a sparkline, or Tab to it and use ← →. Churn going down is shown as good news.
        </p>
      </div>
    </div>
  );
}
