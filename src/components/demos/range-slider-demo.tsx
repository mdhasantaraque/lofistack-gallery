"use client";

import { useState } from "react";
import { RangeSlider, type RangeValue } from "@/components/ui/range-slider";

// Deterministic sample so the server and browser render the same bars.
function samplePrices(count: number) {
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => {
    // Mostly mid-range laptops, a cluster of budget ones and a long premium tail.
    const r = rand();
    const base = r < 0.2 ? 350 + rand() * 250 : r < 0.85 ? 700 + rand() * 700 : 1400 + rand() * 1100;
    return Math.round(base / 10) * 10;
  });
}

const prices = samplePrices(480);
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function RangeSliderDemo() {
  const [price, setPrice] = useState<RangeValue>([700, 1500]);
  const [committed, setCommitted] = useState<RangeValue>([700, 1500]);
  const [rating, setRating] = useState<RangeValue>([3.5, 5]);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-3xl gap-10">
        <div>
          <RangeSlider
            label="Laptop price"
            min={300}
            max={2500}
            step={10}
            minDistance={50}
            value={price}
            onChange={setPrice}
            onChangeEnd={setCommitted}
            data={prices}
            bins={32}
            formatValue={usd}
          />
          <p className="mt-3 text-xs text-zinc-500">
            Last committed: {usd(committed[0])} – {usd(committed[1])}{" "}
            <span className="text-zinc-600">(onChangeEnd fires when you let go, so you fetch once, not 60 times)</span>
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <RangeSlider
            label="Rating"
            min={1}
            max={5}
            step={0.5}
            value={rating}
            onChange={setRating}
            accent="#fbbf24"
            showInputs={false}
            formatValue={(n) => `${n.toFixed(1)} ★`}
          />
          <RangeSlider
            label="Disabled"
            min={0}
            max={100}
            defaultValue={[20, 60]}
            accent="#a78bfa"
            showInputs={false}
            disabled
          />
        </div>
      </div>
    </div>
  );
}
