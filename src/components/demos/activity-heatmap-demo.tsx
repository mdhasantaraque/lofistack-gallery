"use client";

import { useMemo, useState } from "react";
import { ActivityHeatmap, type HeatmapDay } from "@/components/ui/activity-heatmap";

const END = "2026-10-13";

// Deterministic fake commit history: quieter weekends, a holiday gap and a busy launch month.
function sampleHistory(days: number): HeatmapDay[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const end = Date.parse(`${END}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => {
    const ms = end - (days - 1 - i) * 86_400_000;
    const date = new Date(ms).toISOString().slice(0, 10);
    const weekday = new Date(ms).getUTCDay();
    const month = new Date(ms).getUTCMonth();
    const weekend = weekday === 0 || weekday === 6;
    const holiday = date >= "2025-12-22" && date <= "2026-01-04";
    const launch = month === 8; // September
    const chance = holiday ? 0.05 : weekend ? 0.3 : 0.8;
    const count = rand() < chance ? Math.ceil(rand() * (launch ? 14 : 6)) : 0;
    return { date, count };
  });
}

const history = sampleHistory(400);

const accents = [
  { name: "Mint", value: "#34d399" },
  { name: "Sky", value: "#38bdf8" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Amber", value: "#fbbf24" },
];

export default function ActivityHeatmapDemo() {
  const [accent, setAccent] = useState(accents[0].value);
  const [weekStart, setWeekStart] = useState<0 | 1>(0);
  const [selected, setSelected] = useState<HeatmapDay | null>(null);

  const selectedLabel = useMemo(
    () =>
      selected
        ? new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(
            Date.parse(`${selected.date}T00:00:00Z`),
          )
        : null,
    [selected],
  );

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Color" className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Color</span>
          {accents.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-label={a.name}
              aria-pressed={accent === a.value}
              onClick={() => setAccent(a.value)}
              className="size-6 rounded-full ring-offset-2 ring-offset-zinc-950 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 aria-pressed:ring-2 aria-pressed:ring-zinc-100"
              style={{ background: a.value }}
            />
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={weekStart === 1}
            onChange={(e) => setWeekStart(e.target.checked ? 1 : 0)}
            className="size-4 accent-emerald-400"
          />
          Weeks start on Monday
        </label>
      </div>

      <ActivityHeatmap
        label="Commits in the last year"
        data={history}
        endDate={END}
        weekStart={weekStart}
        accent={accent}
        unit={["commit", "commits"]}
        onSelectDay={setSelected}
      />

      <p className="mt-4 min-h-5 text-sm text-zinc-400" aria-live="polite">
        {selected ? (
          <>
            <span className="font-medium text-zinc-100">{selectedLabel}</span>: {selected.count} commit
            {selected.count === 1 ? "" : "s"}
          </>
        ) : (
          "Click a day, or Tab into the grid and use the arrow keys, then press Enter."
        )}
      </p>
    </div>
  );
}
