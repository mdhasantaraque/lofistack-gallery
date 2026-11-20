"use client";

import { useState, type MouseEvent } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

const home = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
    <path d="M10 2 2 9h2v8h4v-5h4v5h4V9h2L10 2Z" />
  </svg>
);

const trail: Crumb[] = [
  { label: "Home", href: "#home", icon: home },
  { label: "Workspaces", href: "#workspaces" },
  { label: "LofiStack Studio", href: "#studio" },
  { label: "Projects", href: "#projects" },
  { label: "Component Gallery", href: "#gallery" },
  { label: "Week 9", href: "#week-9" },
  { label: "Responsive Breadcrumbs with a very long page title", href: undefined },
];

export default function BreadcrumbsDemo() {
  const [width, setWidth] = useState(100);
  const [clicked, setClicked] = useState<string | null>(null);

  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    e.preventDefault();
    setClicked(a.getAttribute("href"));
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10" onClickCapture={onClickCapture}>
      <label className="mb-6 block text-sm text-zinc-400">
        Container width: <span className="tabular-nums text-zinc-200">{width}%</span>
        <input
          type="range"
          min={20}
          max={100}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="mt-2 block w-full max-w-sm accent-sky-400"
        />
      </label>
      <div
        className="rounded-xl border border-dashed border-zinc-700 p-3 transition-[width]"
        style={{ width: `${width}%` }}
      >
        <Breadcrumbs items={trail} />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 p-3">
        <Breadcrumbs items={trail.slice(0, 3).concat({ label: "Settings" })} accent="#a78bfa" />
      </div>
      <p className="mt-4 text-xs text-zinc-500" aria-live="polite">
        {clicked
          ? `Clicked ${clicked}`
          : "Drag the slider: middle levels fold into “…”, and very narrow widths show a back link."}
      </p>
    </div>
  );
}
