"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

export interface NavSection {
  /** The id of the section element on the page. */
  id: string;
  label: string;
}

export interface ScrollspyNavbarProps {
  brand: ReactNode;
  sections: NavSection[];
  /** Right-hand slot, e.g. a sign-in button. */
  actions?: ReactNode;
  /** Element that scrolls. Defaults to the window. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Slide away while scrolling down, come back on any scroll up. */
  hideOnScroll?: boolean;
  /** Scroll distance in px after which the bar gets compact and blurred. */
  condenseAt?: number;
  accent?: string;
  /** Fires when the highlighted section changes. */
  onActiveChange?: (id: string) => void;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ScrollspyNavbar({
  brand,
  sections,
  actions,
  scrollContainer,
  hideOnScroll = true,
  condenseAt = 24,
  accent = "#a78bfa",
  onActiveChange,
  className = "",
}: ScrollspyNavbarProps) {
  const id = useId();
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lastY = useRef(0);
  const jumping = useRef(false);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const activeRef = useRef(active);
  const [hidden, setHidden] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Latest callback without re-subscribing the scroll listener.
  const onActiveRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveRef.current = onActiveChange;
  });

  useEffect(() => {
    const target: HTMLElement | Window = scrollContainer?.current ?? window;
    const getY = () => (target instanceof Window ? window.scrollY : target.scrollTop);
    const getMax = () =>
      target instanceof Window
        ? document.documentElement.scrollHeight - window.innerHeight
        : target.scrollHeight - target.clientHeight;
    const rootTop = () => (target instanceof Window ? 0 : target.getBoundingClientRect().top);

    const update = () => {
      const y = getY();
      const navHeight = navRef.current?.offsetHeight ?? 64;

      setCondensed(y > condenseAt);
      if (hideOnScroll && !jumping.current) {
        const navHasFocus = navRef.current?.contains(document.activeElement) ?? false;
        if (y > lastY.current + 4 && y > navHeight * 2 && !navHasFocus) setHidden(true);
        else if (y < lastY.current - 4 || y <= navHeight) setHidden(false);
      }
      lastY.current = y;
      // During a link jump, keep the clicked link lit instead of flashing through every section passed.
      if (jumping.current) return;

      // The active section is the last one whose top has passed just under the bar.
      // At the very bottom, the last section wins even if it's too short to reach the top.
      let current = sections[0]?.id ?? "";
      if (getMax() - y < 2) current = sections[sections.length - 1]?.id ?? current;
      else {
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top - rootTop() <= navHeight + 16) current = s.id;
        }
      }
      if (activeRef.current !== current) {
        activeRef.current = current;
        setActive(current);
        onActiveRef.current?.(current);
      }
    };

    const initial = window.setTimeout(update, 0);
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(initial);
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollContainer, sections, hideOnScroll, condenseAt]);

  const jumpTo = (e: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    e.preventDefault();
    const container = scrollContainer?.current;
    const navHeight = navRef.current?.offsetHeight ?? 64;
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    // Keep the bar visible for the whole programmatic scroll. It ends on `scrollend`, or after a
    // fallback delay for browsers without it and for jumps that don't move at all.
    const target: HTMLElement | Window = container ?? window;
    jumping.current = true;
    setHidden(false);
    let fallback = 0;
    const finish = () => {
      clearTimeout(fallback);
      target.removeEventListener("scrollend", finish);
      jumping.current = false;
      lastY.current = container ? container.scrollTop : window.scrollY;
    };
    target.addEventListener("scrollend", finish);
    fallback = window.setTimeout(finish, 1500);
    if (container) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top: top - navHeight, behavior });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navHeight, behavior });
    }
    // Move focus to the section so keyboard and screen reader users land there too.
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    if (activeRef.current !== sectionId) {
      activeRef.current = sectionId;
      setActive(sectionId);
      onActiveChange?.(sectionId);
    }
    setMenuOpen(false);
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const linkClass = (isActive: boolean) =>
    [
      "group relative rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nb-accent)]",
      isActive ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-100",
    ].join(" ");

  return (
    <nav
      ref={navRef}
      aria-label="Page sections"
      style={{ "--nb-accent": accent } as CSSProperties}
      className={[
        "sticky top-0 z-30 w-full border-b transition-[transform,background-color,border-color,padding] duration-300 ease-out motion-reduce:transition-none",
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        condensed || menuOpen
          ? "border-zinc-800 bg-zinc-950/80 py-2 backdrop-blur-md"
          : "border-transparent bg-transparent py-4",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6">
        <div className="shrink-0 font-semibold text-zinc-50">{brand}</div>

        <ul className="hidden items-center gap-1 md:flex" role="list">
          {sections.map((s) => {
            const isActive = s.id === active;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => jumpTo(e, s.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={linkClass(isActive)}
                >
                  {s.label}
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-[var(--nb-accent)] transition-transform duration-300 motion-reduce:transition-none",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
                    ].join(" ")}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {actions && <div className="hidden sm:block">{actions}</div>}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls={`${id}-menu`}
            className="grid size-9 place-items-center rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nb-accent)] md:hidden"
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id={`${id}-menu`} onKeyDown={onMenuKeyDown} className="border-t border-zinc-800 px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col" role="list">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => jumpTo(e, s.id)}
                  aria-current={s.id === active ? "location" : undefined}
                  className={[
                    "flex items-center justify-between rounded-lg px-3 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nb-accent)]",
                    s.id === active ? "bg-zinc-900 text-zinc-50" : "text-zinc-300 hover:bg-zinc-900",
                  ].join(" ")}
                >
                  {s.label}
                  {s.id === active && (
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--nb-accent)]" />
                  )}
                </a>
              </li>
            ))}
          </ul>
          {actions && <div className="mt-3 sm:hidden">{actions}</div>}
        </div>
      )}
    </nav>
  );
}

export default ScrollspyNavbar;
