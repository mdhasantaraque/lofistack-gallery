"use client";

import { useMemo, useState } from "react";
import { LineChart, type LineSeries } from "@/components/ui/line-chart";

const END = Date.parse("2026-11-18T00:00:00Z");

// Deterministic sample traffic: weekly rhythm, a slow upward trend and a launch spike.
function makeSeries(days: number): LineSeries[] {
  let seed = 21;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const xs = Array.from({ length: days }, (_, i) =>
    new Date(END - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
  const visitors = xs.map((x, i) => {
    const weekday = new Date(`${x}T00:00:00Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.7 : 1;
    const launch = x >= "2026-11-10" && x <= "2026-11-12" ? 1.8 : 1;
    return Math.round((900 + i * (600 / days) + rand() * 220) * weekend * launch);
  });
  return [
    { id: "visitors", label: "Visitors", data: xs.map((x, i) => ({ x, y: visitors[i] })) },
    {
      id: "signups",
      label: "Sign-ups",
      data: xs.map((x, i) => ({ x, y: Math.round(visitors[i] * (0.06 + rand() * 0.03)) })),
    },
    {
      id: "trials",
      label: "Trials started",
      data: xs.map((x, i) => ({ x, y: Math.round(visitors[i] * (0.02 + rand() * 0.015)) })),
    },
  ];
}

const RANGES = { "7D": 7, "30D": 30, "90D": 90 } as const;

export default function LineChartDemo() {
  const [range, setRange] = useState<keyof typeof RANGES>("30D");
  const series = useMemo(() => makeSeries(RANGES[range]), [range]);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-50">Traffic and conversions</p>
          <p className="text-sm text-zinc-500">Hover, or Tab into the chart and use ← →</p>
        </div>
        <div
          role="group"
          aria-label="Time range"
          className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1"
        >
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={[
                "rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                range === r ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <LineChart title={`Daily traffic, last ${RANGES[range]} days`} series={series} />
    </div>
  );
}
