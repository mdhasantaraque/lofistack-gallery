"use client";

import { useState } from "react";
import { BarChart, type BarLayout, type BarSeries } from "@/components/ui/bar-chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const base: BarSeries[] = [
  { id: "organic", label: "Organic", values: [820, 910, 1040, 980, 1120, 1260, 1190, 1340, 1420, 1510, 1630, 1580] },
  { id: "paid", label: "Paid ads", values: [450, 520, 610, 700, 640, 580, 720, 810, 760, 690, 840, 920] },
  { id: "referral", label: "Referral", values: [210, 240, 260, 300, 340, 390, 420, 410, 470, 520, 560, 610] },
  { id: "partners", label: "Partners", values: [90, 110, 160, 140, 180, 230, 260, 240, 300, 330, 310, 380] },
];

/** Deterministic wobble, so the shuffle is the same on the server and in the browser. */
const wobble = (seed: number, i: number) => 0.7 + ((Math.sin(seed * 9.7 + i * 3.1) + 1) / 2) * 0.6;

export default function BarChartDemo() {
  const [range, setRange] = useState<6 | 12>(6);
  const [seed, setSeed] = useState(0);
  const [layout, setLayout] = useState<BarLayout>("stacked");

  const series = base.map((s, si) => ({
    ...s,
    values: s.values.slice(-range).map((v, i) => (seed === 0 ? v : Math.round(v * wobble(seed + si, i)))),
  }));

  const btn =
    "rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

  return (
    <div className="w-full max-w-2xl space-y-3">
      <BarChart
        title="Sign-ups by channel"
        categories={MONTHS.slice(-range)}
        series={series}
        onLayoutChange={setLayout}
        formatValue={(n) => n.toLocaleString("en-US")}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => setRange(range === 6 ? 12 : 6)}>
          Show {range === 6 ? "12" : "6"} months
        </button>
        <button type="button" className={btn} onClick={() => setSeed(seed + 1)}>
          Shuffle data
        </button>
        <span className="text-xs text-zinc-500">
          Layout: <span className="text-zinc-300">{layout}</span>
        </span>
      </div>
      <p className="text-xs text-zinc-500">
        Hover a bar, or Tab into the chart and use ← →. Click a legend item to hide a series.
      </p>
    </div>
  );
}
