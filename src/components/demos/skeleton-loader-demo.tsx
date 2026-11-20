"use client";

import { useEffect, useState } from "react";
import { LoadingSwap, Skeleton } from "@/components/ui/skeleton-loader";

const people = [
  { name: "Ayesha Rahman", role: "Design lead", color: "#f472b6" },
  { name: "Tanvir Ahmed", role: "Frontend", color: "#38bdf8" },
  { name: "Nadia Islam", role: "Product", color: "#34d399" },
];

const SPEEDS = { Fast: 120, Normal: 900, Slow: 2400 } as const;
type Speed = keyof typeof SPEEDS;

function TeamSkeleton() {
  return (
    <ul className="space-y-4">
      {people.map((p) => (
        <li key={p.name} className="flex items-center gap-3">
          <Skeleton shape="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton width="45%" />
            <Skeleton width="25%" height="0.6rem" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Team() {
  return (
    <ul className="space-y-4">
      {people.map((p) => (
        <li key={p.name} className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-full text-sm font-semibold text-zinc-950"
            style={{ background: p.color }}
            aria-hidden="true"
          >
            {p.name
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-100">{p.name}</p>
            <p className="text-xs text-zinc-500">{p.role}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The usual approach: show the skeleton exactly while loading, however short. */
function NaiveSwap({ loading }: { loading: boolean }) {
  return <div aria-busy={loading || undefined}>{loading ? <TeamSkeleton /> : <Team />}</div>;
}

export default function SkeletonLoaderDemo() {
  const [speed, setSpeed] = useState<Speed>("Fast");
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState<string>("—");

  // Simulated request: each run turns loading on, then off after the chosen time.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), SPEEDS[speed]);
    return () => clearTimeout(t);
  }, [run, speed]);

  const reload = (s: Speed) => {
    setSpeed(s);
    setLoading(true);
    setShown("…");
    setRun((r) => r + 1);
  };

  const card = "rounded-2xl border border-zinc-800 bg-zinc-950 p-5";

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-400">Load again:</span>
        {(Object.keys(SPEEDS) as Speed[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => reload(s)}
            className="h-8 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            {s} <span className="text-zinc-500">{SPEEDS[s]} ms</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Naive loader" className={card}>
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Naive: flashes on fast loads
          </p>
          <NaiveSwap loading={loading} />
        </section>
        <section aria-label="Flash-free loader" className={card}>
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-sky-300">
            LoadingSwap: 200 ms delay, 500 ms minimum
          </p>
          <LoadingSwap
            loading={loading}
            skeleton={<TeamSkeleton />}
            label="Loading team"
            onSettled={(ms) => setShown(ms ? `skeleton shown for ${ms} ms` : "skeleton skipped, load was fast")}
          >
            <Team />
          </LoadingSwap>
        </section>
      </div>
      <p className="mt-4 text-sm text-zinc-400" aria-live="polite">
        Last run ({speed}): <span className="text-zinc-200">{shown}</span>
      </p>
    </div>
  );
}
