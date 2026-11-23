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

export interface SpeedDialAction {
  id: string;
  /** Always shown next to the action, so touch users never have to guess what an icon means. */
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export interface SpeedDialProps {
  actions: SpeedDialAction[];
  /** Accessible name of the main button and the menu, e.g. "Create". */
  label: string;
  /** Icon on the main button. A plus sign by default; it turns into a cross while open. */
  icon?: ReactNode;
  /** Which way the actions fan out. */
  direction?: "up" | "down";
  /** Which side the button sits on. Labels go on the opposite side. */
  align?: "end" | "start";
  /** Dims the page behind while open. */
  scrim?: boolean;
  accent?: string;
  className?: string;
}

const PLUS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-6" aria-hidden="true">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export function SpeedDial({
  actions,
  label,
  icon = PLUS,
  direction = "up",
  align = "end",
  scrim = false,
  accent = "#a78bfa",
  className = "",
}: SpeedDialProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  // Which item gets focus when the menu opens: the nearest one, or the farthest when opened with
  // the arrow that points away from the button's travel direction.
  const [startAt, setStartAt] = useState<"first" | "last">("first");

  const enabled = actions.map((a, i) => (a.disabled ? -1 : i)).filter((i) => i >= 0);

  // Move focus into the menu once it's on screen.
  useEffect(() => {
    if (!open) return;
    const target = startAt === "first" ? enabled[0] : enabled[enabled.length - 1];
    if (target !== undefined) items.current[target]?.focus();
    // Only when it opens; enabled is derived from props on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startAt]);

  // A press anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) fabRef.current?.focus();
  };

  const openMenu = (from: "first" | "last") => {
    setStartAt(from);
    setOpen(true);
  };

  // Arrow keys follow what you see: with direction "up", Arrow Up moves away from the button.
  const away = direction === "up" ? "ArrowUp" : "ArrowDown";
  const toward = direction === "up" ? "ArrowDown" : "ArrowUp";

  const onFabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === away || e.key === toward) {
      e.preventDefault();
      openMenu(e.key === away ? "first" : "last");
    }
  };

  const onItemKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const pos = enabled.indexOf(index);
    const go = (p: number) => items.current[enabled[(p + enabled.length) % enabled.length]]?.focus();
    const keys: Record<string, () => void> = {
      [away]: () => go(pos + 1),
      [toward]: () => go(pos - 1),
      Home: () => go(0),
      End: () => go(enabled.length - 1),
      Escape: () => close(),
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };

  // Tabbing out of the menu closes it without pulling focus back.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) close(false);
  };

  const up = direction === "up";
  const end = align === "end";

  return (
    <>
      {scrim && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
          aria-hidden="true"
        />
      )}
      <div
        ref={rootRef}
        onBlur={onBlur}
        style={{ "--sd-accent": accent } as CSSProperties}
        className={[
          "relative z-50 flex gap-3",
          up ? "flex-col-reverse" : "flex-col",
          end ? "items-end" : "items-start",
          className,
        ].join(" ")}
      >
        <button
          ref={fabRef}
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? `${id}-menu` : undefined}
          onClick={() => (open ? close() : openMenu("first"))}
          onKeyDown={onFabKey}
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--sd-accent)] text-zinc-950 shadow-lg shadow-black/40 transition-[transform,box-shadow] duration-200 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none"
        >
          <span
            className={[
              "grid place-items-center transition-transform duration-200 motion-reduce:transition-none",
              open ? "rotate-45" : "",
            ].join(" ")}
          >
            {icon}
          </span>
        </button>

        {open && (
          <ul
            id={`${id}-menu`}
            role="menu"
            aria-label={label}
            aria-orientation="vertical"
            className={["flex gap-2.5", up ? "flex-col-reverse" : "flex-col", end ? "items-end" : "items-start"].join(
              " ",
            )}
          >
            {actions.map((a, i) => (
              <li
                key={a.id}
                role="none"
                // Each action appears a beat after the one before it, starting nearest the button.
                style={{ transitionDelay: `${i * 35}ms` }}
                className={[
                  "transition-[opacity,translate] duration-200 ease-out starting:opacity-0 motion-reduce:transition-none",
                  up ? "starting:translate-y-3" : "starting:-translate-y-3",
                ].join(" ")}
              >
                <button
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={a.disabled}
                  onClick={() => {
                    a.onSelect();
                    close();
                  }}
                  onKeyDown={(e) => onItemKey(e, i)}
                  className={[
                    "group flex items-center gap-3 rounded-full focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
                    end ? "flex-row" : "flex-row-reverse",
                  ].join(" ")}
                >
                  <span className="whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-sm font-medium text-zinc-100 shadow-md shadow-black/30 group-hover:bg-zinc-700 group-focus-visible:bg-zinc-700">
                    {a.label}
                  </span>
                  {/* Centered under the 56px main button. */}
                  <span className="mx-1 grid size-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-md shadow-black/30 transition-colors group-hover:border-zinc-500 group-focus-visible:ring-2 group-focus-visible:ring-[var(--sd-accent)]">
                    {a.icon}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default SpeedDial;
