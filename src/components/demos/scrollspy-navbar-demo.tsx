"use client";

import { useRef, useState } from "react";
import { ScrollspyNavbar, type NavSection } from "@/components/ui/scrollspy-navbar";

const sections: NavSection[] = [
  { id: "nb-overview", label: "Overview" },
  { id: "nb-features", label: "Features" },
  { id: "nb-pricing", label: "Pricing" },
  { id: "nb-reviews", label: "Reviews" },
  { id: "nb-contact", label: "Contact" },
];

const copy: Record<string, { tint: string; lines: string[] }> = {
  "nb-overview": {
    tint: "from-violet-500/20",
    lines: ["Scroll inside this frame. The bar slides away as you read down and returns the moment you scroll up."],
  },
  "nb-features": {
    tint: "from-sky-500/20",
    lines: [
      "The underline follows the section you're reading.",
      "Click a link: it scrolls with the bar's height in mind and moves focus to the section.",
    ],
  },
  "nb-pricing": {
    tint: "from-emerald-500/20",
    lines: ["After a few pixels the bar condenses and blurs what's behind it."],
  },
  "nb-reviews": {
    tint: "from-amber-500/20",
    lines: ["On small screens the links move into a menu. Escape closes it and returns focus to the button."],
  },
  "nb-contact": {
    tint: "from-pink-500/20",
    lines: ["This section is short, but it still lights up at the bottom of the page."],
  },
};

export default function ScrollspyNavbarDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState("Overview");

  return (
    <div className="w-full rounded-2xl bg-zinc-950 p-2 sm:p-3">
      <div
        ref={frameRef}
        className="relative h-[28rem] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950"
        tabIndex={0}
        aria-label="Demo page"
      >
        <ScrollspyNavbar
          brand={
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-5 rounded-md bg-gradient-to-br from-violet-400 to-sky-400" />
              Orbit
            </span>
          }
          sections={sections}
          scrollContainer={frameRef}
          onActiveChange={(sid) => setLog(sections.find((s) => s.id === sid)?.label ?? sid)}
          actions={
            <a
              href="#nb-contact"
              className="inline-flex h-8 items-center rounded-lg bg-zinc-100 px-3 text-sm font-medium text-zinc-950 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              Get started
            </a>
          }
        />
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-h`}
            className={[
              "bg-gradient-to-b to-transparent px-5 py-10 focus:outline-none sm:px-8",
              copy[s.id].tint,
              i === sections.length - 1 ? "min-h-40" : "min-h-[30rem]",
            ].join(" ")}
          >
            <h3 id={`${s.id}-h`} className="text-2xl font-bold text-zinc-50">
              {s.label}
            </h3>
            {copy[s.id].lines.map((line) => (
              <p key={line} className="mt-3 max-w-md text-zinc-400">
                {line}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-3 px-1 text-sm text-zinc-500" aria-live="polite">
        onActiveChange: <span className="text-zinc-200">{log}</span>
      </p>
    </div>
  );
}
