"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export interface SplitButtonAction {
  id: string;
  label: string;
  /** Second line under the label in the menu. */
  description?: string;
  icon?: ReactNode;
  /** Shown on the right, e.g. "Ctrl+S". Display only. */
  shortcut?: string;
  disabled?: boolean;
  /** Red text, with a divider above it. */
  danger?: boolean;
  onSelect: () => void;
}

export interface SplitButtonProps {
  actions: SplitButtonAction[];
  /**
   * "menu": the first action is the main button, the rest live in the menu.
   * "choice": the menu picks which action the main button runs (like a merge button) and remembers it.
   */
  mode?: "menu" | "choice";
  defaultActionId?: string;
  /** Accessible name of the arrow button. */
  menuLabel?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  /** Shows a spinner on the main button and blocks both halves. */
  loading?: boolean;
  /** Which edge the menu lines up with. */
  align?: "start" | "end";
  accent?: string;
  className?: string;
}

const sizes = {
  sm: { main: "h-8 px-3 text-xs", toggle: "h-8 w-8", menu: "w-56" },
  md: { main: "h-10 px-4 text-sm", toggle: "h-10 w-10", menu: "w-72" },
};

export function SplitButton({
  actions,
  mode = "menu",
  defaultActionId,
  menuLabel = "More options",
  size = "md",
  disabled = false,
  loading = false,
  align = "end",
  accent = "#818cf8",
  className = "",
}: SplitButtonProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef({ text: "", timer: 0 });
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [side, setSide] = useState(align);
  const [focusIndex, setFocusIndex] = useState(0);
  const [chosenId, setChosenId] = useState(defaultActionId ?? actions[0]?.id);

  const primary = mode === "choice" ? (actions.find((a) => a.id === chosenId) ?? actions[0]) : actions[0];
  const menuItems = mode === "choice" ? actions : actions.slice(1);
  const enabled = menuItems.map((a, i) => (a.disabled ? -1 : i)).filter((i) => i >= 0);
  const blocked = disabled || loading;

  // Move real focus whenever the highlighted item changes while the menu is open.
  useEffect(() => {
    if (open) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  // Close on a pointer press anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openMenu = (edge: "first" | "last") => {
    if (blocked || enabled.length === 0) return;
    // Flip upwards when there isn't room for the menu below the button.
    const rect = rootRef.current?.getBoundingClientRect();
    const needed = Math.min(menuItems.length * 56 + 16, 360);
    setOpenUp(rect ? window.innerHeight - rect.bottom < needed && rect.top > needed : false);
    // Switch sides when the menu would run off the screen edge, e.g. on phones.
    const width = size === "sm" ? 224 : 288;
    let nextSide = align;
    if (rect && align === "end" && rect.right - width < 8) nextSide = "start";
    if (rect && align === "start" && rect.left + width > window.innerWidth - 8) nextSide = "end";
    setSide(nextSide);
    const chosen = menuItems.findIndex((a) => a.id === primary?.id);
    setFocusIndex(
      mode === "choice" && chosen >= 0 ? chosen : edge === "first" ? enabled[0] : enabled[enabled.length - 1],
    );
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  };

  const select = (action: SplitButtonAction) => {
    if (action.disabled) return;
    if (mode === "choice") setChosenId(action.id);
    else action.onSelect();
    close();
  };

  const move = (step: number) => {
    const pos = enabled.indexOf(focusIndex);
    setFocusIndex(enabled[(pos + step + enabled.length) % enabled.length]);
  };

  const onToggleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu("last");
    }
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setFocusIndex(enabled[0]),
      End: () => setFocusIndex(enabled[enabled.length - 1]),
      Escape: () => close(),
      Tab: () => close(false),
    };
    if (keys[e.key]) {
      if (e.key !== "Tab") e.preventDefault();
      keys[e.key]();
      return;
    }
    // Type a letter to jump to the next item starting with it.
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const t = typeahead.current;
      clearTimeout(t.timer);
      t.text += e.key.toLowerCase();
      t.timer = window.setTimeout(() => (t.text = ""), 500);
      const start = enabled.indexOf(focusIndex);
      const order = [...enabled.slice(start + 1), ...enabled.slice(0, start + 1)];
      const match = order.find((i) => menuItems[i].label.toLowerCase().startsWith(t.text));
      if (match !== undefined) setFocusIndex(match);
    }
  };

  const s = sizes[size];
  const base =
    "inline-flex items-center justify-center font-semibold transition-[filter,background-color] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sb-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      ref={rootRef}
      style={{ "--sb-accent": accent } as CSSProperties}
      className={["relative inline-flex", className].join(" ")}
    >
      <button
        type="button"
        onClick={() => primary?.onSelect()}
        disabled={blocked || primary?.disabled}
        aria-busy={loading || undefined}
        className={`${base} ${s.main} gap-2 rounded-l-lg bg-[var(--sb-accent)] text-zinc-950 hover:brightness-110 active:brightness-95`}
      >
        {loading ? (
          <svg
            className="size-4 animate-spin motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          primary?.icon
        )}
        {primary?.label}
      </button>
      <span aria-hidden="true" className="w-px bg-zinc-950/25" />
      <button
        ref={toggleRef}
        type="button"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        disabled={blocked || enabled.length === 0}
        onClick={() => (open ? close() : openMenu("first"))}
        onKeyDown={onToggleKeyDown}
        className={`${base} ${s.toggle} rounded-r-lg bg-[var(--sb-accent)] text-zinc-950 hover:brightness-110 active:brightness-95`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={["size-4 transition-transform motion-reduce:transition-none", open ? "rotate-180" : ""].join(" ")}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-label={menuLabel}
          onKeyDown={onMenuKeyDown}
          className={[
            "absolute z-30 max-h-90 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl",
            "origin-top transition-[opacity,scale] duration-150 starting:scale-95 starting:opacity-0 motion-reduce:transition-none",
            s.menu,
            "max-w-[calc(100vw-2rem)]",
            side === "end" ? "right-0" : "left-0",
            openUp ? "bottom-full mb-2" : "top-full mt-2",
          ].join(" ")}
        >
          {menuItems.map((action, i) => {
            const checked = mode === "choice" && action.id === primary?.id;
            return (
              <div key={action.id} role="none">
                {action.danger && i > 0 && <div role="separator" className="my-1 h-px bg-zinc-800" />}
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role={mode === "choice" ? "menuitemradio" : "menuitem"}
                  aria-checked={mode === "choice" ? checked : undefined}
                  aria-disabled={action.disabled || undefined}
                  tabIndex={i === focusIndex ? 0 : -1}
                  onClick={() => select(action)}
                  onMouseEnter={() => !action.disabled && setFocusIndex(i)}
                  className={[
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm focus:outline-none",
                    action.disabled ? "cursor-not-allowed opacity-40" : "focus:bg-zinc-800",
                    action.danger ? "text-red-300" : "text-zinc-100",
                  ].join(" ")}
                >
                  {mode === "choice" ? (
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-4 shrink-0 place-items-center text-[var(--sb-accent)]"
                    >
                      {checked && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  ) : (
                    action.icon && (
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-zinc-400">
                        {action.icon}
                      </span>
                    )
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{action.label}</span>
                    {action.description && (
                      <span className="mt-0.5 block text-xs font-normal leading-snug text-zinc-400">
                        {action.description}
                      </span>
                    )}
                  </span>
                  {action.shortcut && (
                    <kbd className="mt-0.5 shrink-0 font-sans text-xs text-zinc-500">{action.shortcut}</kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SplitButton;
