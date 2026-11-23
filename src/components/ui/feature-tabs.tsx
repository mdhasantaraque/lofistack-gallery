"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface Feature {
  id: string;
  /** Short tab label. */
  label: string;
  /** One line under the label in the desktop list. */
  summary?: string;
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  points?: string[];
  /** Screenshot, video or mock shown above the text. */
  media: ReactNode;
  cta?: { label: string; href: string };
}

export interface FeatureTabsProps {
  features: Feature[];
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  /** Rotate through the tabs on their own. Off for people who prefer reduced motion. */
  autoplay?: boolean;
  /** ms each tab stays before moving on. */
  interval?: number;
  /** Picking a tab by hand stops the rotation, so it doesn't move away while being read. */
  stopOnInteract?: boolean;
  onChange?: (id: string) => void;
  accent?: string;
  className?: string;
}

const subscribeMedia = (query: string) => (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = subscribeMedia(REDUCED);
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};

export function FeatureTabs({
  features,
  title,
  eyebrow,
  description,
  autoplay = true,
  interval = 6000,
  stopOnInteract = true,
  onChange,
  accent = "#a78bfa",
  className = "",
}: FeatureTabsProps) {
  const id = useId();
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = features.length;

  const [activeRaw, setActive] = useState(0);
  const active = Math.min(activeRaw, Math.max(count - 1, 0));
  const [playing, setPlaying] = useState(autoplay);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [inView, setInView] = useState(true);

  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );

  const canPlay = autoplay && !reduced && count > 1;
  // Rotation pauses while it's being looked at or used, and when nobody can see it.
  const running = canPlay && playing && !hovered && !focusInside && inView && pageVisible;

  // Off-screen sections don't need to rotate.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Time left on the current tab survives pauses: hovering for a second and leaving doesn't
  // restart the countdown, and the progress bar (paused by CSS meanwhile) stays in step.
  const progress = useRef({ index: active, remaining: interval });
  useEffect(() => {
    if (!running) return;
    if (progress.current.index !== active) progress.current = { index: active, remaining: interval };
    const started = performance.now();
    let fired = false;
    const timer = window.setTimeout(() => {
      fired = true;
      const next = (active + 1) % count;
      progress.current = { index: next, remaining: interval };
      setActive(next);
      onChange?.(features[next].id);
    }, progress.current.remaining);
    return () => {
      window.clearTimeout(timer);
      if (!fired && progress.current.index === active) {
        progress.current.remaining = Math.max(0, progress.current.remaining - (performance.now() - started));
      }
    };
  }, [running, active, count, interval, features, onChange]);

  // On phones the tabs scroll sideways; keep the active one in view without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = tabs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [active, reduced]);

  const select = (index: number, focus = false) => {
    const next = (index + count) % count;
    if (stopOnInteract) setPlaying(false);
    setActive(next);
    if (next !== active) onChange?.(features[next].id);
    if (focus) tabs.current[next]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select(moves[e.key], true);
  };

  // Keyboard focus on a tab or the panel pauses (someone is reading). A mouse click doesn't, and
  // neither does the play button, or pressing Play would look like it did nothing.
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    setFocusInside(target.matches(":focus-visible") && !target.closest("[data-play]"));
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
  };

  const feature = features[active];
  if (!feature) return null;

  return (
    <section
      ref={rootRef}
      aria-labelledby={`${id}-title`}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ "--ft-accent": accent, "--ft-interval": `${interval}ms` } as CSSProperties}
      className={["relative w-full", className].join(" ")}
    >
      <style>{`@keyframes ft-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ft-accent)]">{eyebrow}</p>
          )}
          <h2 id={`${id}-title`} className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h2>
          {description && <p className="mt-2 text-sm text-zinc-400 sm:text-base">{description}</p>}
        </div>
        {canPlay && (
          <button
            type="button"
            data-play
            onClick={() => setPlaying(!playing)}
            className="flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden="true">
              {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4 2.5v11l9-5.5z" />}
            </svg>
            {playing ? "Pause rotation" : "Play rotation"}
          </button>
        )}
      </div>

      {/* Hover pauses over the tabs and panel only, not over the play button. */}
      <div
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-8"
      >
        <div
          ref={listRef}
          role="tablist"
          aria-label={title}
          className="relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {features.map((f, i) => {
            const selected = i === active;
            return (
              <button
                key={f.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`${id}-tab-${f.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={onTabKey}
                className={[
                  "relative flex shrink-0 items-start gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)] lg:w-full lg:py-3.5",
                  selected
                    ? "border-zinc-700 bg-zinc-900 text-zinc-50"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200",
                ].join(" ")}
              >
                {f.icon && (
                  <span
                    className={[
                      "mt-0.5 grid size-5 shrink-0 place-items-center",
                      selected ? "text-[var(--ft-accent)]" : "text-zinc-500",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {f.icon}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-medium">{f.label}</span>
                  {f.summary && <span className="mt-0.5 hidden text-xs text-zinc-500 lg:block">{f.summary}</span>}
                </span>
                {selected && canPlay && playing && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-800" aria-hidden="true">
                    <span
                      className="block h-full origin-left bg-[var(--ft-accent)]"
                      style={{
                        animationName: "ft-fill",
                        animationDuration: "var(--ft-interval)",
                        animationTimingFunction: "linear",
                        animationFillMode: "forwards",
                        animationPlayState: running ? "running" : "paused",
                      }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          key={feature.id}
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${feature.id}`}
          tabIndex={0}
          className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-opacity duration-300 starting:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)] motion-reduce:transition-none sm:p-5"
        >
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">{feature.media}</div>
          <h3 className="mt-5 text-lg font-semibold text-zinc-50">{feature.title}</h3>
          <div className="mt-1.5 text-sm leading-relaxed text-zinc-400">{feature.description}</div>
          {feature.points && feature.points.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {feature.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mt-0.5 size-4 shrink-0 text-[var(--ft-accent)]"
                    aria-hidden="true"
                  >
                    <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          )}
          {feature.cta && (
            <a
              href={feature.cta.href}
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--ft-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
            >
              {feature.cta.label}
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeatureTabs;
