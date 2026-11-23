"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

const CATEGORIES = ["Apartments", "Houses", "Studios", "Shared rooms"];
const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Parking",
  "Lift",
  "Generator backup",
  "Balcony",
  "Gym",
  "Pets allowed",
];
const AREAS = ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Bashundhara"];

const share = [
  { label: "Copy link", icon: "🔗" },
  { label: "WhatsApp", icon: "💬" },
  { label: "Email", icon: "✉️" },
  { label: "Messenger", icon: "📨" },
];

export default function BottomSheetDemo() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [category, setCategory] = useState("Apartments");
  const [amenities, setAmenities] = useState<string[]>(["Wi-Fi"]);
  const [areas, setAreas] = useState<string[]>([]);
  const [applied, setApplied] = useState("Apartments · Wi-Fi");
  const [height, setHeight] = useState<number | null>(null);
  const [shared, setShared] = useState("");

  const toggle = (list: string[], set: (next: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const results = 48 - amenities.length * 5 - (areas.length ? 18 - areas.length * 3 : 0);

  const chip = (active: boolean) =>
    [
      "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
      active
        ? "border-violet-400 bg-violet-400/15 text-violet-100"
        : "border-zinc-700 text-zinc-300 hover:border-zinc-500",
    ].join(" ");

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setHeight(0);
            setFiltersOpen(true);
          }}
          aria-haspopup="dialog"
          className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Filters
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-haspopup="dialog"
          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          Share listing
        </button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
        <dt className="text-zinc-500">Applied</dt>
        <dd className="text-zinc-200">{applied}</dd>
        <dt className="text-zinc-500">Sheet height</dt>
        <dd className="text-zinc-200">{height === null ? "-" : height === 0 ? "Half" : "Full"}</dd>
        <dt className="text-zinc-500">Shared</dt>
        <dd className="text-zinc-200">{shared || "-"}</dd>
      </dl>
      <p className="text-xs text-zinc-500">
        Drag the bar at the top of the sheet, or focus it and press ↑ / ↓. Flick it down or press Esc to close.
      </p>

      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        description="Narrow down rentals near you."
        snapPoints={[0.5, 0.92]}
        onSnapChange={setHeight}
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCategory("Apartments");
                setAmenities([]);
                setAreas([]);
              }}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => {
                setApplied([category, ...amenities, ...areas].join(" · "));
                setFiltersOpen(false);
              }}
              className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              Show {Math.max(results, 3)} homes
            </button>
          </div>
        }
      >
        <fieldset>
          <legend className="text-sm font-medium text-zinc-200">Type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={chip(category === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-zinc-200">Amenities</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggle(amenities, setAmenities, a)}
                  className="size-4 accent-violet-500"
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-zinc-200">Area</legend>
          <p className="text-xs text-zinc-500">Pull the sheet up to see them all.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={areas.includes(a)}
                onClick={() => toggle(areas, setAreas, a)}
                className={chip(areas.includes(a))}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 h-40 rounded-xl border border-dashed border-zinc-800 p-4 text-xs text-zinc-500">
          Long content scrolls inside the sheet while the header and footer stay put.
        </div>
      </BottomSheet>

      <BottomSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Share listing"
        description="3-bed apartment, Dhanmondi"
        snapPoints={[0.38]}
      >
        <ul className="grid grid-cols-4 gap-3" role="list">
          {share.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => {
                  setShared(s.label);
                  setShareOpen(false);
                }}
                className="flex w-full flex-col items-center gap-2 rounded-xl p-2 text-xs text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span className="grid size-12 place-items-center rounded-full bg-zinc-800 text-xl" aria-hidden="true">
                  {s.icon}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
