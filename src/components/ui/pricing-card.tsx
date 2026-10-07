"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

export interface PricingFeature {
  label: ReactNode;
  /** Defaults to true. Excluded features render struck through. */
  included?: boolean;
}

export interface PricingCardProps {
  name: string;
  description?: string;
  /** Numeric price. Changes animate from the old value to the new one. */
  price: number;
  /** ISO 4217 code, e.g. "USD", "BDT". */
  currency?: string;
  locale?: string;
  /** Shown after the price, e.g. "/month". */
  period?: string;
  /** Previous price, shown struck through when higher than `price`. */
  originalPrice?: number;
  /** Small note under the price, e.g. "Billed yearly". */
  priceNote?: string;
  features: PricingFeature[];
  /** Pill shown at the top right, e.g. "Most popular". */
  badge?: string;
  /** Adds the animated gradient border and a filled CTA. */
  highlighted?: boolean;
  /** Any CSS color for the border, glow, checks and CTA. */
  accent?: string;
  ctaLabel?: string;
  /** Renders the CTA as a link instead of a button. */
  ctaHref?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
  /** Shows a skeleton while plan data loads. */
  loading?: boolean;
  /** Entrance animation delay in ms, for staggering a row of cards. */
  delay?: number;
  className?: string;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Counts from the previous value to the new one. Renders the final value on the server. */
function AnimatedNumber({
  value,
  format,
  duration = 600,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  // Where the count is right now, so a change mid-animation continues from there.
  const displayRef = useRef(value);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const from = displayRef.current;
    if (reduced || from === value) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <>{format(reduced ? value : display)}</>;
}

function CheckIcon({ included }: { included: boolean }) {
  return included ? (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 size-5 shrink-0 text-[var(--pc-accent)]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.86-9.86a.75.75 0 0 0-1.22-.88l-3.24 4.5-1.64-1.64a.75.75 0 1 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.09l3.77-5.2Z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-zinc-600" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM7.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 11l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 12.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 11l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 9.94 7.28 7.22Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PricingCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none">
      <div className="h-5 w-24 rounded bg-zinc-800" />
      <div className="h-4 w-3/4 rounded bg-zinc-800" />
      <div className="mt-2 h-10 w-32 rounded bg-zinc-800" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-zinc-800" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
      <div className="mt-6 h-11 rounded-xl bg-zinc-800" />
    </div>
  );
}

export function PricingCard({
  name,
  description,
  price,
  currency = "USD",
  locale = "en-US",
  period = "/month",
  originalPrice,
  priceNote,
  features,
  badge,
  highlighted = false,
  accent = "#818cf8",
  ctaLabel = "Get started",
  ctaHref,
  onCtaClick,
  ctaDisabled = false,
  loading = false,
  delay = 0,
  className = "",
}: PricingCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  });
  const format = (n: number) => formatter.format(Number.isInteger(price) ? Math.round(n) : n);
  const showOriginal = originalPrice !== undefined && originalPrice > price;

  const ctaClasses = [
    "mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold",
    "transition-[transform,background-color,box-shadow,filter] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "active:scale-[0.98] motion-reduce:transition-none",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50",
    highlighted
      ? "bg-[var(--pc-accent)] text-zinc-950 shadow-[0_8px_24px_-8px_var(--pc-accent)] hover:brightness-110"
      : "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-[var(--pc-accent)] hover:bg-zinc-800",
  ].join(" ");

  return (
    <div
      style={{ "--pc-accent": accent, transitionDelay: `${delay}ms` } as CSSProperties}
      className={[
        "w-full transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "group relative isolate h-full overflow-hidden rounded-3xl p-px",
          "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_var(--pc-accent)]",
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          highlighted ? "bg-zinc-800" : "bg-zinc-800 hover:bg-zinc-700",
        ].join(" ")}
      >
        {highlighted && (
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-spin bg-[conic-gradient(from_0deg,transparent_0deg,var(--pc-accent)_60deg,transparent_140deg,transparent_220deg,var(--pc-accent)_280deg,transparent_360deg)] motion-reduce:animate-none"
            style={{ animationDuration: "6s" }}
          />
        )}

        <article
          aria-busy={loading || undefined}
          aria-label={`${name} plan`}
          className="relative isolate flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-zinc-950 p-6 sm:p-8"
        >
          {/* Accent glow that fades in on hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-48 w-3/4 -translate-x-1/2 rounded-full bg-[var(--pc-accent)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
          />

          {loading ? (
            <PricingCardSkeleton />
          ) : (
            <>
              <header className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-zinc-50">{name}</h3>
                {badge && (
                  <span className="rounded-full border border-[var(--pc-accent)]/40 bg-[var(--pc-accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--pc-accent)]">
                    {badge}
                  </span>
                )}
              </header>
              {description && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>}

              <div className="mt-6 flex flex-wrap items-baseline gap-x-2">
                <span
                  className="text-4xl font-bold tracking-tight text-zinc-50 tabular-nums sm:text-5xl"
                  aria-live="polite"
                >
                  <AnimatedNumber value={price} format={format} />
                </span>
                {period && <span className="text-sm text-zinc-400">{period}</span>}
                {showOriginal && (
                  <span className="text-sm text-zinc-500 line-through">
                    <span className="sr-only">was </span>
                    {format(originalPrice)}
                  </span>
                )}
              </div>
              {priceNote && <p className="mt-1 text-xs text-zinc-500">{priceNote}</p>}

              <ul className="mt-6 space-y-3 text-sm" role="list">
                {features.map((feature, i) => {
                  const included = feature.included ?? true;
                  return (
                    <li
                      key={i}
                      style={{ transitionDelay: `${delay + 150 + i * 60}ms` }}
                      className={[
                        "flex gap-3 transition-[opacity,transform] duration-500 motion-reduce:transition-none",
                        mounted ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 motion-reduce:translate-x-0",
                        included ? "text-zinc-200" : "text-zinc-500 line-through",
                      ].join(" ")}
                    >
                      <CheckIcon included={included} />
                      <span>
                        {!included && <span className="sr-only">Not included: </span>}
                        {feature.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto">
                {ctaHref ? (
                  <a
                    href={ctaDisabled ? undefined : ctaHref}
                    aria-disabled={ctaDisabled || undefined}
                    onClick={onCtaClick}
                    className={ctaClasses}
                  >
                    {ctaLabel}
                  </a>
                ) : (
                  <button type="button" onClick={onCtaClick} disabled={ctaDisabled} className={ctaClasses}>
                    {ctaLabel}
                  </button>
                )}
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}

export default PricingCard;
