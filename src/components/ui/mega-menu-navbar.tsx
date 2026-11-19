"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface MegaLink {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  /** Small pill after the label, e.g. "New". */
  badge?: string;
}

export interface MegaSection {
  title: string;
  links: MegaLink[];
}

export interface MegaItem {
  id: string;
  label: string;
  /** Plain link when there are no sections. */
  href?: string;
  sections?: MegaSection[];
  /** Highlight card on the right side of the panel. */
  feature?: { eyebrow?: string; title: string; description: string; href: string; cta: string };
}

export interface MegaMenuNavbarProps {
  brand: ReactNode;
  items: MegaItem[];
  /** Right-hand slot, e.g. sign-in buttons. Moves into the drawer on phones. */
  actions?: ReactNode;
  /** Delay before a hovered item opens, so passing the mouse across the bar doesn't flash panels. */
  hoverDelay?: number;
  accent?: string;
  className?: string;
}

const LINK_SELECTOR = "a[data-mega-link]";

export function MegaMenuNavbar({
  brand,
  items,
  actions,
  hoverDelay = 120,
  accent = "#818cf8",
  className = "",
}: MegaMenuNavbarProps) {
  const id = useId();
  const navRef = useRef<HTMLElement>(null);
  const triggers = useRef(new Map<string, HTMLElement>());
  const timer = useRef(0);
  const focusFirst = useRef(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // After opening from the keyboard, move focus to the panel's first link.
  useEffect(() => {
    if (!openId || !focusFirst.current) return;
    focusFirst.current = false;
    document.getElementById(`${id}-panel-${openId}`)?.querySelector<HTMLElement>(LINK_SELECTOR)?.focus();
  }, [openId, id]);

  // Close on a press anywhere outside the bar.
  useEffect(() => {
    if (!openId && !drawer) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current?.contains(e.target as Node)) return;
      setOpenId(null);
      setDrawer(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openId, drawer]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const schedule = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };

  const onEnter = (itemId: string) => {
    // Moving between items while a panel is open switches right away; opening the first one waits.
    if (openId) {
      clearTimeout(timer.current);
      setOpenId(itemId);
    } else schedule(() => setOpenId(itemId), hoverDelay);
  };

  const close = (returnFocusTo?: string) => {
    clearTimeout(timer.current);
    setOpenId(null);
    if (returnFocusTo) triggers.current.get(returnFocusTo)?.focus();
  };

  const topLevel = items.map((i) => i.id);
  const moveTop = (from: string, step: number) => {
    const next = topLevel[(topLevel.indexOf(from) + step + topLevel.length) % topLevel.length];
    triggers.current.get(next)?.focus();
    if (openId) setOpenId(items.find((i) => i.id === next)?.sections ? next : null);
  };

  const onTriggerKey = (e: KeyboardEvent, item: MegaItem) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      moveTop(item.id, e.key === "ArrowRight" ? 1 : -1);
    } else if (item.sections && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      clearTimeout(timer.current);
      // Already open from hovering: focus the first link now, since no state change will run the effect.
      if (openId === item.id) {
        document.getElementById(`${id}-panel-${item.id}`)?.querySelector<HTMLElement>(LINK_SELECTOR)?.focus();
        return;
      }
      focusFirst.current = true;
      setOpenId(item.id);
    } else if (e.key === "Escape") {
      close(item.id);
    }
  };

  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>, itemId: string) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(itemId);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const links = [...e.currentTarget.querySelectorAll<HTMLElement>(LINK_SELECTOR)];
    const i = links.indexOf(document.activeElement as HTMLElement);
    links[(i + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
  };

  // Tabbing out of the whole bar closes the panel.
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenId(null);
  };

  const topClass = (active: boolean) =>
    [
      "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]",
      active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50",
    ].join(" ");

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      onBlur={onBlur}
      onMouseLeave={() => openId && schedule(() => setOpenId(null), 200)}
      style={{ "--mm-accent": accent } as CSSProperties}
      className={["relative z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur", className].join(" ")}
    >
      <div className="flex h-14 items-center gap-6 px-4 sm:px-6">
        <div className="shrink-0 font-semibold text-zinc-50">{brand}</div>

        <ul className="hidden items-center gap-1 md:flex" role="list">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <li
                key={item.id}
                onMouseEnter={() => (item.sections ? onEnter(item.id) : openId && schedule(() => setOpenId(null), 150))}
              >
                {item.sections ? (
                  <button
                    ref={(el) => {
                      if (el) triggers.current.set(item.id, el);
                    }}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-panel-${item.id}`}
                    onClick={() => {
                      clearTimeout(timer.current);
                      setOpenId(isOpen ? null : item.id);
                    }}
                    onKeyDown={(e) => onTriggerKey(e, item)}
                    className={topClass(isOpen)}
                  >
                    {item.label}
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={[
                        "size-4 text-zinc-500 transition-transform motion-reduce:transition-none",
                        isOpen ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : (
                  <a
                    ref={(el) => {
                      if (el) triggers.current.set(item.id, el);
                    }}
                    href={item.href}
                    onKeyDown={(e) => onTriggerKey(e, item)}
                    className={topClass(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          {actions && <div className="hidden md:block">{actions}</div>}
          <button
            type="button"
            aria-expanded={drawer}
            aria-controls={`${id}-drawer`}
            onClick={() => setDrawer((d) => !d)}
            className="grid size-9 place-items-center rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] md:hidden"
          >
            <span className="sr-only">{drawer ? "Close menu" : "Open menu"}</span>
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {drawer ? (
                <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop panels */}
      {items.map(
        (item) =>
          item.sections && (
            <div
              key={item.id}
              id={`${id}-panel-${item.id}`}
              hidden={openId !== item.id}
              onMouseEnter={() => clearTimeout(timer.current)}
              onKeyDown={(e) => onPanelKey(e, item.id)}
              className="absolute inset-x-0 top-full hidden border-b border-zinc-800 bg-zinc-950 shadow-2xl md:block md:[&[hidden]]:hidden"
            >
              <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1fr_18rem]">
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {item.sections.map((section) => (
                    <div key={section.title}>
                      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {section.title}
                      </p>
                      <ul className="mt-2 space-y-0.5" role="list">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              data-mega-link
                              onClick={() => close()}
                              className="flex gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                            >
                              {link.icon && (
                                <span
                                  aria-hidden="true"
                                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-800 text-[var(--mm-accent)]"
                                >
                                  {link.icon}
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                                  {link.label}
                                  {link.badge && (
                                    <span className="rounded-full bg-[color-mix(in_oklab,var(--mm-accent)_20%,transparent)] px-1.5 py-px text-[10px] font-semibold text-[var(--mm-accent)]">
                                      {link.badge}
                                    </span>
                                  )}
                                </span>
                                {link.description && (
                                  <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                                    {link.description}
                                  </span>
                                )}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {item.feature && (
                  <a
                    href={item.feature.href}
                    data-mega-link
                    onClick={() => close()}
                    className="group flex flex-col justify-end rounded-2xl bg-gradient-to-br from-[color-mix(in_oklab,var(--mm-accent)_35%,#18181b)] to-zinc-900 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                  >
                    {item.feature.eyebrow && (
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-300">
                        {item.feature.eyebrow}
                      </span>
                    )}
                    <span className="mt-2 text-lg font-semibold text-zinc-50">{item.feature.title}</span>
                    <span className="mt-1 text-sm leading-relaxed text-zinc-300">{item.feature.description}</span>
                    <span className="mt-4 text-sm font-semibold text-zinc-50">
                      {item.feature.cta}{" "}
                      <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </a>
                )}
              </div>
            </div>
          ),
      )}

      {/* Phone drawer: every section becomes an accordion */}
      {drawer && (
        <div
          id={`${id}-drawer`}
          onKeyDown={(e) => e.key === "Escape" && setDrawer(false)}
          className="max-h-[70vh] overflow-y-auto border-t border-zinc-800 px-4 pb-4 md:hidden"
        >
          <ul className="divide-y divide-zinc-800" role="list">
            {items.map((item) => (
              <li key={item.id}>
                {item.sections ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={expanded === item.id}
                      aria-controls={`${id}-acc-${item.id}`}
                      onClick={() => setExpanded((x) => (x === item.id ? null : item.id))}
                      className="flex w-full items-center justify-between py-3 text-left text-base text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={["text-zinc-500 transition-transform", expanded === item.id ? "rotate-45" : ""].join(
                          " ",
                        )}
                      >
                        +
                      </span>
                    </button>
                    <div id={`${id}-acc-${item.id}`} hidden={expanded !== item.id} className="pb-3">
                      {item.sections.map((section) => (
                        <div key={section.title} className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            {section.title}
                          </p>
                          <ul className="mt-1" role="list">
                            {section.links.map((link) => (
                              <li key={link.label}>
                                <a
                                  href={link.href}
                                  onClick={() => setDrawer(false)}
                                  className="block rounded-md py-2 pl-2 text-sm text-zinc-300 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setDrawer(false)}
                    className="block py-3 text-base text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          {actions && <div className="mt-4">{actions}</div>}
        </div>
      )}
    </nav>
  );
}

export default MegaMenuNavbar;
