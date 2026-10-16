"use client";

import { useState } from "react";
import { DonutChart, type DonutDatum } from "@/components/ui/donut-chart";

const datasets: Record<string, { title: string; data: DonutDatum[]; format: (n: number) => string; total: string }> = {
  traffic: {
    title: "Visitors by source, last 30 days",
    total: "Visitors",
    format: (n) => n.toLocaleString("en-US"),
    data: [
      { id: "organic", label: "Organic search", value: 18420 },
      { id: "direct", label: "Direct", value: 9310 },
      { id: "social", label: "Social", value: 6480 },
      { id: "referral", label: "Referral", value: 3920 },
      { id: "email", label: "Email", value: 2150 },
      { id: "ads", label: "Paid ads", value: 640 },
    ],
  },
  budget: {
    title: "Monthly spend by category",
    total: "Spent",
    format: (n) => `$${n.toLocaleString("en-US")}`,
    data: [
      { id: "rent", label: "Rent", value: 1400, color: "#818cf8" },
      { id: "food", label: "Food", value: 520, color: "#34d399" },
      { id: "transport", label: "Transport", value: 180, color: "#fbbf24" },
      { id: "fun", label: "Fun", value: 240, color: "#f472b6" },
      { id: "savings", label: "Savings", value: 600, color: "#38bdf8" },
    ],
  },
};

export default function DonutChartDemo() {
  const [key, setKey] = useState<keyof typeof datasets>("traffic");
  const [hidden, setHidden] = useState<string[]>([]);
  const set = datasets[key];

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div
        role="group"
        aria-label="Dataset"
        className="mb-8 inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1"
      >
        {(Object.keys(datasets) as (keyof typeof datasets)[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={key === k}
            onClick={() => {
              setKey(k);
              setHidden([]);
            }}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
              key === k ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100",
            ].join(" ")}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="mx-auto max-w-2xl">
        <DonutChart
          key={key}
          title={set.title}
          data={set.data}
          formatValue={set.format}
          totalLabel={set.total}
          onHiddenChange={setHidden}
        />
      </div>
      <p className="mt-6 text-xs text-zinc-500" aria-live="polite">
        onHiddenChange: {hidden.length ? hidden.join(", ") : "nothing hidden"}
      </p>
    </div>
  );
}
