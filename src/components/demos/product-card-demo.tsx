"use client";

import { useState } from "react";
import { ProductCard, type AddToCartPayload, type ProductColor } from "@/components/ui/product-card";

/** Flat illustration of a sneaker from 3 angles, tinted per color. */
function Shoe({ body, accent, view, bg }: { body: string; accent: string; view: 0 | 1 | 2; bg: string }) {
  return (
    <svg viewBox="0 0 400 300" className="size-full" role="img" aria-label="Sneaker illustration">
      <rect width="400" height="300" fill={bg} />
      <ellipse cx="200" cy="238" rx="150" ry="14" fill="rgb(0 0 0 / 0.25)" />
      {view === 0 && (
        <g>
          <path d="M60 205c10-50 40-85 85-95l40 25c25 14 60 18 95 22 40 5 62 22 62 48v8H60z" fill={body} />
          <path d="M56 210h290c8 0 12 8 10 14l-2 6H62c-6 0-10-6-6-20z" fill="#f4f4f5" />
          <path d="M150 115l30 22M168 108l28 22M186 104l26 22" stroke="#f4f4f5" strokeWidth="6" strokeLinecap="round" />
          <path d="M235 165c30 6 60 10 85 22" stroke={accent} strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      )}
      {view === 1 && (
        <g transform="translate(200 150) rotate(-12)">
          <ellipse cx="0" cy="0" rx="150" ry="62" fill={body} />
          <ellipse cx="-20" cy="-4" rx="70" ry="34" fill="rgb(0 0 0 / 0.25)" />
          <path d="M-60 -20h60M-60 -4h60M-60 12h60" stroke="#f4f4f5" strokeWidth="6" strokeLinecap="round" />
          <path d="M60 -40c40 10 70 25 80 40" stroke={accent} strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      )}
      {view === 2 && (
        <g transform="translate(200 150) rotate(-12)">
          <ellipse cx="0" cy="0" rx="150" ry="58" fill="#f4f4f5" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${-110 + i * 27} -34v68`}
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
            />
          ))}
        </g>
      )}
    </svg>
  );
}

const shoeColors = (
  options: { id: string; name: string; body: string; accent: string; bg: string }[],
): ProductColor[] =>
  options.map((o) => ({
    id: o.id,
    name: o.name,
    swatch: `linear-gradient(135deg, ${o.body} 55%, ${o.accent} 55%)`,
    images: ([0, 1, 2] as const).map((v) => <Shoe key={v} view={v} body={o.body} accent={o.accent} bg={o.bg} />),
  }));

const colors = shoeColors([
  { id: "midnight", name: "Midnight", body: "#312e81", accent: "#a78bfa", bg: "#1e1b4b" },
  { id: "volt", name: "Volt", body: "#3f6212", accent: "#d9f99d", bg: "#1a2e05" },
  { id: "ember", name: "Ember", body: "#9a3412", accent: "#fdba74", bg: "#2a1206" },
]);

const sizes = [
  { id: "39", label: "39", stock: 4 },
  { id: "40", label: "40", stock: 0 },
  { id: "41", label: "41", stock: 12 },
  { id: "42", label: "42", stock: 2 },
  { id: "43", label: "43", stock: 8 },
  { id: "44", label: "44", stock: 0 },
  { id: "45", label: "45", stock: 6 },
];

export default function ProductCardDemo() {
  const [cart, setCart] = useState<AddToCartPayload[]>([]);
  const [failNext, setFailNext] = useState(false);

  const add = async (item: AddToCartPayload) => {
    const shouldFail = failNext;
    await new Promise((r) => setTimeout(r, 800));
    if (shouldFail) {
      setFailNext(false);
      throw new Error(`Size ${item.sizeId} just sold out in this color. Pick another size.`);
    }
    setCart((c) => [...c, item]);
  };

  const count = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-sm flex-col gap-4">
        <ProductCard
          brand="Lofi Runners"
          name="Orbit Knit Sneaker"
          price={96}
          compareAtPrice={120}
          rating={{ value: 4.6, count: 1284 }}
          badge="New"
          colors={colors}
          sizes={sizes}
          onAddToCart={add}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
          <span aria-live="polite">
            Cart: <span className="font-medium text-zinc-100">{count}</span> item{count === 1 ? "" : "s"}
            {cart.length > 0 &&
              ` (last: ${colors.find((c) => c.id === cart.at(-1)!.colorId)?.name}, size ${cart.at(-1)!.sizeId} × ${cart.at(-1)!.quantity})`}
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={failNext}
              onChange={(e) => setFailNext(e.target.checked)}
              className="size-4 accent-violet-400"
            />
            Fail next add
          </label>
        </div>
      </div>
    </div>
  );
}
