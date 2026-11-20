"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface SkeletonProps {
  /** line: a text line, circle: an avatar, block: an image or card area. */
  shape?: "line" | "circle" | "block";
  width?: string;
  height?: string;
  className?: string;
}

/** One placeholder shape with a shimmer. Hidden from screen readers; the wrapper announces loading. */
export function Skeleton({ shape = "line", width, height, className = "" }: SkeletonProps) {
  const size: CSSProperties = {
    width: width ?? (shape === "circle" ? "2.5rem" : "100%"),
    height: height ?? (shape === "line" ? "0.75rem" : shape === "circle" ? "2.5rem" : "8rem"),
  };
  return (
    <span
      aria-hidden="true"
      style={size}
      className={[
        "relative block overflow-hidden bg-zinc-800",
        shape === "circle" ? "rounded-full" : shape === "line" ? "rounded" : "rounded-xl",
        // A soft highlight sweeps across; with reduced motion it gently pulses instead.
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[sk-shimmer_1.4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "motion-reduce:animate-pulse motion-reduce:before:hidden",
        className,
      ].join(" ")}
    />
  );
}

type Phase = "waiting" | "skeleton" | "content";

export interface LoadingSwapProps {
  loading: boolean;
  /** What to show while loading. Build it from <Skeleton> pieces shaped like the real content. */
  skeleton: ReactNode;
  children: ReactNode;
  /** Wait this long before showing the skeleton, so fast loads never flash it. */
  delay?: number;
  /** Once the skeleton shows, keep it at least this long, so it never blinks. */
  minDuration?: number;
  /** Spoken while loading. */
  label?: string;
  /** Reports how long the skeleton was on screen, in ms (0 when it never showed). */
  onSettled?: (shownForMs: number) => void;
  className?: string;
}

/**
 * Swaps a skeleton for content without flicker:
 * fast loads (under `delay`) go straight to content, and once the skeleton is up it stays for
 * at least `minDuration`. Timers drive every change, so nothing sets state during render.
 */
export function LoadingSwap({
  loading,
  skeleton,
  children,
  delay = 200,
  minDuration = 500,
  label = "Loading",
  onSettled,
  className = "",
}: LoadingSwapProps) {
  const [phase, setPhase] = useState<Phase>(loading ? "waiting" : "content");
  const shownAt = useRef<number | null>(null);
  const wasLoading = useRef(loading);
  const settledRef = useRef(onSettled);
  useEffect(() => {
    settledRef.current = onSettled;
  });

  useEffect(() => {
    let timer = 0;
    if (loading) {
      // Start or restart loading. Whatever is on screen (nothing, or the previous content) stays
      // until the delay passes; only then does the skeleton appear.
      timer = window.setTimeout(() => {
        if (shownAt.current === null) shownAt.current = performance.now();
        setPhase("skeleton");
      }, delay);
    } else if (phase !== "content") {
      // Done loading. If the skeleton is up, let it finish its minimum time first.
      const elapsed = shownAt.current === null ? null : performance.now() - shownAt.current;
      const wait = elapsed === null ? 0 : Math.max(0, minDuration - elapsed);
      timer = window.setTimeout(() => {
        const shown = shownAt.current === null ? 0 : Math.round(performance.now() - shownAt.current);
        shownAt.current = null;
        setPhase("content");
        settledRef.current?.(shown);
      }, wait);
    } else if (wasLoading.current) {
      // A reload finished before the delay: the skeleton never showed.
      timer = window.setTimeout(() => settledRef.current?.(0), 0);
    }
    wasLoading.current = loading;
    return () => clearTimeout(timer);
    // `phase` is read only to know where we are when `loading` flips; it shouldn't restart timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, delay, minDuration]);

  return (
    <div aria-busy={loading || phase !== "content" || undefined} className={["relative", className].join(" ")}>
      <span className="sr-only" aria-live="polite">
        {phase === "skeleton" ? `${label}…` : ""}
      </span>
      {phase === "content" ? (
        <div className="animate-[sk-fade_0.25s_ease-out] motion-reduce:animate-none">{children}</div>
      ) : phase === "skeleton" ? (
        skeleton
      ) : (
        // While waiting, keep the space the skeleton will need so the page doesn't jump.
        <div className="invisible">{skeleton}</div>
      )}
      <style>{`@keyframes sk-shimmer{100%{transform:translateX(100%)}}@keyframes sk-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

export default LoadingSwap;
