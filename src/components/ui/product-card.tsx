"use client";

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

export interface ProductColor {
  id: string;
  name: string;
  /** Any CSS color for the swatch. */
  swatch: string;
  /** Gallery slides for this color: images, SVGs, anything. */
  images: ReactNode[];
}

export interface ProductSize {
  id: string;
  label: string;
  /** 0 means sold out. */
  stock: number;
}

export interface AddToCartPayload {
  colorId: string;
  sizeId: string;
  quantity: number;
}

export interface ProductCardProps {
  name: string;
  brand?: string;
  price: number;
  /** Original price. When higher than `price`, shows a strike-through and a % off badge. */
  compareAtPrice?: number;
  currency?: string;
  locale?: string;
  rating?: { value: number; count: number };
  colors: ProductColor[];
  sizes: ProductSize[];
  /** Small label over the image, e.g. "New". */
  badge?: string;
  /** Stock at or below this shows "Only N left". */
  lowStockAt?: number;
  maxQuantity?: number;
  /** May return a promise. The button shows Adding…, then Added, or the error. */
  onAddToCart: (payload: AddToCartPayload) => void | Promise<void>;
  defaultWishlisted?: boolean;
  onWishlistChange?: (saved: boolean) => void;
  accent?: string;
  className?: string;
}

type CartState = "idle" | "adding" | "added";

/** Arrow keys move through the enabled options of a radio group, wrapping at the ends. */
function radioKeys<T>(
  e: KeyboardEvent,
  options: T[],
  current: number,
  isEnabled: (o: T) => boolean,
  pick: (i: number) => void,
) {
  const step =
    e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (!step) return;
  e.preventDefault();
  for (let n = 1; n <= options.length; n++) {
    const i = (current + step * n + options.length * n) % options.length;
    if (isEnabled(options[i])) return pick(i);
  }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="relative inline-flex text-zinc-700" aria-hidden="true">
      {"★★★★★"}
      <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${(value / 5) * 100}%` }}>
        {"★★★★★"}
      </span>
    </span>
  );
}

export function ProductCard({
  name,
  brand,
  price,
  compareAtPrice,
  currency = "USD",
  locale = "en-US",
  rating,
  colors,
  sizes,
  badge,
  lowStockAt = 3,
  maxQuantity = 10,
  onAddToCart,
  defaultWishlisted = false,
  onWishlistChange,
  accent = "#a78bfa",
  className = "",
}: ProductCardProps) {
  const id = useId();
  const sizeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const colorRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeStart = useRef<number | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [slide, setSlide] = useState(0);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(defaultWishlisted);
  const [cart, setCart] = useState<CartState>("idle");
  const [error, setError] = useState<string | null>(null);

  const color = colors[colorIndex];
  const images = color.images;
  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const maxQty = Math.max(1, Math.min(maxQuantity, size?.stock ?? maxQuantity));
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const discount = compareAtPrice && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;

  const pickColor = (i: number) => {
    setColorIndex(i);
    setSlide(0);
    colorRefs.current[i]?.focus();
  };

  const pickSize = (i: number) => {
    const next = sizes[i];
    setSizeId(next.id);
    setQuantity((q) => Math.min(q, Math.max(1, Math.min(maxQuantity, next.stock))));
    setError(null);
    sizeRefs.current[i]?.focus();
  };

  const goTo = (i: number) => setSlide((i + images.length) % images.length);

  const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40) goTo(slide + (dx < 0 ? 1 : -1));
  };

  const add = async () => {
    if (!size) {
      setError("Choose a size first");
      const first = sizes.findIndex((s) => s.stock > 0);
      sizeRefs.current[first]?.focus();
      return;
    }
    setError(null);
    setCart("adding");
    try {
      await onAddToCart({ colorId: color.id, sizeId: size.id, quantity });
      setCart("added");
      window.setTimeout(() => setCart((c) => (c === "added" ? "idle" : c)), 2000);
    } catch (err) {
      setCart("idle");
      setError(err instanceof Error ? err.message : "Couldn't add to cart. Try again.");
    }
  };

  const selectedSizeIndex = sizes.findIndex((s) => s.id === sizeId);
  const sizeTabStop = selectedSizeIndex >= 0 ? selectedSizeIndex : sizes.findIndex((s) => s.stock > 0);
  const navButton =
    "absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-zinc-950/70 text-zinc-100 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)]";

  return (
    <article
      aria-labelledby={`${id}-name`}
      style={{ "--pc-accent": accent } as CSSProperties}
      className={[
        "flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950",
        className,
      ].join(" ")}
    >
      {/* Gallery */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        className="group relative aspect-[4/3] touch-pan-y select-none overflow-hidden bg-zinc-900"
        onPointerDown={(e) => (swipeStart.current = e.clientX)}
        onPointerUp={onSwipeEnd}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
              aria-hidden={i !== slide}
              className="h-full w-full shrink-0"
            >
              {img}
            </div>
          ))}
        </div>

        {(badge || discount > 0) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {badge && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-950">{badge}</span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">-{discount}%</span>
            )}
          </div>
        )}

        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Saved to wishlist" : "Save to wishlist"}
          onClick={() => {
            setSaved(!saved);
            onWishlistChange?.(!saved);
          }}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-zinc-950/70 backdrop-blur transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)] motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.4 1.1 4.9 2.9 1.5-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"
              fill={saved ? "#f472b6" : "none"}
              stroke={saved ? "#f472b6" : "#e4e4e7"}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(slide - 1)}
              aria-label="Previous image"
              className={`${navButton} left-3`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(slide + 1)}
              aria-label="Next image"
              className={`${navButton} right-3`}
            >
              ›
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === slide || undefined}
                  className={[
                    "h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)]",
                    i === slide ? "w-5 bg-zinc-100" : "w-1.5 bg-zinc-100/40 hover:bg-zinc-100/70",
                  ].join(" ")}
                />
              ))}
            </div>
          </>
        )}
        <p className="sr-only" aria-live="polite">
          {color.name}, image {slide + 1} of {images.length}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {brand && <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{brand}</p>}
        <h3 id={`${id}-name`} className="mt-1 text-lg font-semibold text-zinc-50">
          {name}
        </h3>
        {rating && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Stars value={rating.value} />
            <span className="sr-only">
              Rated {rating.value} out of 5 from {rating.count} reviews
            </span>
            <span aria-hidden="true">
              {rating.value.toFixed(1)} ({rating.count.toLocaleString(locale)})
            </span>
          </p>
        )}
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-zinc-50">{fmt.format(price)}</span>
          {discount > 0 && (
            <span className="text-sm text-zinc-500 line-through">
              <span className="sr-only">was </span>
              {fmt.format(compareAtPrice!)}
            </span>
          )}
        </p>

        {/* Colors */}
        <div className="mt-4">
          <p id={`${id}-color-label`} className="text-sm text-zinc-400">
            Color: <span className="text-zinc-100">{color.name}</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${id}-color-label`}
            className="mt-2 flex flex-wrap gap-2"
            onKeyDown={(e) => radioKeys(e, colors, colorIndex, () => true, pickColor)}
          >
            {colors.map((c, i) => (
              <button
                key={c.id}
                ref={(el) => {
                  colorRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={i === colorIndex}
                aria-label={c.name}
                tabIndex={i === colorIndex ? 0 : -1}
                onClick={() => pickColor(i)}
                className={[
                  "size-8 rounded-full border-2 border-zinc-950 ring-2 transition-shadow focus-visible:outline-none focus-visible:ring-[var(--pc-accent)]",
                  i === colorIndex ? "ring-zinc-100" : "ring-zinc-700 hover:ring-zinc-500",
                ].join(" ")}
                style={{ background: c.swatch }}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="mt-4">
          <p id={`${id}-size-label`} className="text-sm text-zinc-400">
            Size{size ? <span className="text-zinc-100">: {size.label}</span> : ""}
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${id}-size-label`}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={error && !size ? true : undefined}
            className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5"
            onKeyDown={(e) => radioKeys(e, sizes, sizeTabStop, (s) => s.stock > 0, pickSize)}
          >
            {sizes.map((s, i) => {
              const soldOut = s.stock <= 0;
              const checked = s.id === sizeId;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    sizeRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-disabled={soldOut || undefined}
                  aria-label={soldOut ? `${s.label}, sold out` : s.label}
                  tabIndex={i === sizeTabStop ? 0 : -1}
                  onClick={() => !soldOut && pickSize(i)}
                  className={[
                    "h-9 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)]",
                    soldOut
                      ? "cursor-not-allowed border-zinc-800 text-zinc-600 line-through"
                      : checked
                        ? "border-[var(--pc-accent)] bg-[color-mix(in_oklab,var(--pc-accent)_18%,transparent)] text-zinc-50"
                        : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 min-h-5 text-xs" aria-live="polite">
            {size && size.stock <= lowStockAt && (
              <span className="text-amber-300">
                Only {size.stock} left in {size.label}
              </span>
            )}
          </p>
        </div>

        <div className="@container mt-auto flex items-center gap-2 pt-3">
          <div className="flex h-10 items-center rounded-lg border border-zinc-700" role="group" aria-label="Quantity">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="grid h-full w-9 place-items-center rounded-l-lg text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pc-accent)] disabled:opacity-30"
            >
              −
            </button>
            <output aria-live="polite" className="w-7 text-center text-sm tabular-nums text-zinc-100">
              {quantity}
            </output>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="grid h-full w-9 place-items-center rounded-r-lg text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pc-accent)] disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => void add()}
            disabled={cart === "adding"}
            aria-live="polite"
            className={[
              "inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-[background-color,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-wait",
              cart === "added"
                ? "bg-emerald-400 text-zinc-950"
                : "bg-[var(--pc-accent)] text-zinc-950 hover:brightness-110",
            ].join(" ")}
          >
            {cart === "adding" ? (
              "Adding…"
            ) : cart === "added" ? (
              "✓ Added to cart"
            ) : (
              <>
                Add to cart
                {/* The total only shows when the row is wide enough to keep the label on one line. */}
                <span className="hidden @[20rem]:inline">· {fmt.format(price * quantity)}</span>
              </>
            )}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

export default ProductCard;
