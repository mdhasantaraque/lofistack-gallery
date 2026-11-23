"use client";

import { useState } from "react";
import { SpeedDial, type SpeedDialAction } from "@/components/ui/speed-dial";

const svg = (d: string) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KINDS = {
  note: { label: "Note", icon: svg("M5 3h7l3 3v11H5V3Zm7 0v3h3M8 10h5M8 13h4"), color: "text-violet-300" },
  list: { label: "Checklist", icon: svg("M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M11 6h5M11 12h5"), color: "text-sky-300" },
  photo: {
    label: "Photo",
    icon: svg("M3 6h3l1.5-2h5L14 6h3v10H3V6Zm7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"),
    color: "text-emerald-300",
  },
  voice: {
    label: "Voice memo",
    icon: svg("M10 3a2 2 0 0 0-2 2v5a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2ZM5.5 10a4.5 4.5 0 0 0 9 0M10 14.5V17"),
    color: "text-amber-300",
  },
} as const;
type Kind = keyof typeof KINDS;

export default function SpeedDialDemo() {
  const [items, setItems] = useState<{ id: number; kind: Kind }[]>([
    { id: 1, kind: "note" },
    { id: 2, kind: "list" },
  ]);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [scrim, setScrim] = useState(false);

  const add = (kind: Kind) => setItems((list) => [{ id: Date.now(), kind }, ...list]);

  const actions: SpeedDialAction[] = (Object.keys(KINDS) as Kind[]).map((k) => ({
    id: k,
    label: `New ${KINDS[k].label.toLowerCase()}`,
    icon: KINDS[k].icon,
    onSelect: () => add(k),
    disabled: k === "voice" && items.length >= 8,
  }));

  const toggle =
    "rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="relative h-[28rem] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 px-5 py-4">
          <p className="text-base font-semibold text-zinc-50">My notes</p>
          <p className="text-xs text-zinc-500">{items.length} items</p>
        </div>
        <ul className="space-y-2 overflow-y-auto p-4" style={{ maxHeight: "calc(28rem - 4.5rem)" }}>
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
            >
              <span className={KINDS[it.kind].color}>{KINDS[it.kind].icon}</span>
              <span className="text-sm text-zinc-200">
                {KINDS[it.kind].label} {items.length - i}
              </span>
            </li>
          ))}
        </ul>
        <div className={["absolute right-4", direction === "up" ? "bottom-4" : "top-20"].join(" ")}>
          <SpeedDial label="Create" actions={actions} direction={direction} scrim={scrim} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={toggle} onClick={() => setDirection(direction === "up" ? "down" : "up")}>
          Open {direction === "up" ? "downward" : "upward"}
        </button>
        <button type="button" className={toggle} aria-pressed={scrim} onClick={() => setScrim(!scrim)}>
          Dim page: {scrim ? "on" : "off"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Tab to the + button and press Enter or ↑. Use ↑ ↓ to move, Enter to pick, Esc to close. &ldquo;New voice
        memo&rdquo; turns off at 8 items to show a disabled action.
      </p>
    </div>
  );
}
