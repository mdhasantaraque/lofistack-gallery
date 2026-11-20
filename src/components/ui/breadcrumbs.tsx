"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export interface Crumb {
  label: string;
  /** Leave out on the last item: it's the current page. */
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** Accessible name of the nav landmark. */
  label?: string;
  separator?: ReactNode;
  /** Below this container width, show only a back link to the parent page. */
  compactBelow?: number;
  accent?: string;
  className?: string;
}

const ELLIPSIS_WIDTH = 44;

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-zinc-600" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.2 14.8a.75.75 0 0 1 0-1.06L10.94 10 7.2 6.27a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  separator = <Chevron />,
  compactBelow = 360,
  accent = "#38bdf8",
  className = "",
}: BreadcrumbsProps) {
  const id = useId();
  const wrapRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  // How many middle items are folded into the "…" menu.
  const [collapsed, setCollapsed] = useState(0);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const n = items.length;
  const parent = items[n - 2];

  // Measure every item once in a hidden copy, then work out how many middle items must fold away
  // so the trail fits on one line. Re-runs whenever the available width changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return;
    const fit = () => {
      const avail = wrap.clientWidth;
      const widths = [...measure.children].map((c) => (c as HTMLElement).offsetWidth);
      setCompact(avail < compactBelow && n > 1);
      const total = widths.reduce((a, b) => a + b, 0);
      if (total <= avail || n <= 2) return setCollapsed(0);
      for (let k = 1; k <= n - 2; k++) {
        const shown = widths[0] + ELLIPSIS_WIDTH + widths.slice(k + 1).reduce((a, b) => a + b, 0);
        if (shown <= avail) return setCollapsed(k);
      }
      setCollapsed(n - 2);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [items, n, compactBelow]);

  // Close the menu on an outside press, and focus its first link when it opens.
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && e.target !== menuButtonRef.current) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const onMenuKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const links = [...e.currentTarget.querySelectorAll<HTMLElement>("a")];
    const i = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      links[(i + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    } else if (e.key === "Tab") setMenuOpen(false);
  };

  const linkClass =
    "inline-flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent)]";

  const crumb = (item: Crumb, isLast: boolean) =>
    isLast || !item.href ? (
      <span
        aria-current={isLast ? "page" : undefined}
        title={item.label}
        className="inline-flex min-w-0 items-center gap-1.5 px-1 py-0.5 font-medium text-zinc-100"
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
      </span>
    ) : (
      <a href={item.href} className={linkClass}>
        {item.icon}
        <span className="truncate">{item.label}</span>
      </a>
    );

  const hidden = items.slice(1, 1 + collapsed);

  return (
    <nav
      ref={wrapRef}
      aria-label={label}
      style={{ "--bc-accent": accent } as CSSProperties}
      className={["relative w-full min-w-0 text-sm", className].join(" ")}
    >
      {/* Invisible copy used only to measure each item's natural width. */}
      {/* The zero-size clipping box keeps the measuring row from widening the page. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <div ref={measureRef} className="flex w-max whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 pr-1">
              {i > 0 && separator}
              <span className="inline-flex items-center gap-1.5 px-1 py-0.5 font-medium">
                {item.icon}
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {compact && parent ? (
        <a href={parent.href} className={`${linkClass} -ml-1`}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.8 5.2a.75.75 0 0 1 0 1.06L9.06 10l3.74 3.73a.75.75 0 1 1-1.06 1.06L7.49 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">Back to {parent.label}</span>
        </a>
      ) : (
        <ol className="flex min-w-0 items-center gap-1 whitespace-nowrap" role="list">
          {items.map((item, i) => {
            const isLast = i === n - 1;
            if (i >= 1 && i <= collapsed) {
              // All folded items become one "…" entry, rendered in the slot of the first of them.
              if (i !== 1) return null;
              return (
                <li key="more" className="relative inline-flex items-center gap-1">
                  {separator}
                  <button
                    ref={menuButtonRef}
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls={`${id}-more`}
                    aria-label={`Show ${hidden.length} more level${hidden.length === 1 ? "" : "s"}`}
                    onClick={() => setMenuOpen((o) => !o)}
                    className="grid h-6 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent)]"
                  >
                    …
                  </button>
                  {menuOpen && (
                    <ul
                      ref={menuRef}
                      id={`${id}-more`}
                      onKeyDown={onMenuKey}
                      role="list"
                      className="absolute left-4 top-full z-20 mt-1 min-w-48 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
                    >
                      {hidden.map((h, hi) => (
                        <li key={hi}>
                          <a
                            href={h.href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none"
                            style={{ paddingLeft: `${0.75 + hi * 0.5}rem` }}
                          >
                            {h.icon}
                            {h.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={i} className={["inline-flex items-center gap-1", isLast ? "min-w-0" : "shrink-0"].join(" ")}>
                {i > 0 && separator}
                {crumb(item, isLast)}
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

export default Breadcrumbs;
