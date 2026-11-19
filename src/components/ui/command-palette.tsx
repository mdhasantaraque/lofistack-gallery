"use client";

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface Command {
  id: string;
  label: string;
  /** Heading the command is listed under when the search is empty. */
  group?: string;
  /** Extra words that should find it, e.g. "dark light" for a theme command. */
  keywords?: string;
  /** Keys shown on the right, e.g. ["Ctrl", "B"]. Display only. */
  shortcut?: string[];
  icon?: ReactNode;
  /** Runs when chosen. Leave out when the command has children. */
  perform?: () => void;
  /** Opens a nested list instead of running, e.g. Change theme › Dark / Light. */
  children?: Command[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  /** Ids listed under "Recent" while the search is empty. */
  recentIds?: string[];
  /** Fires after a command runs, e.g. to update the recent list. */
  onRun?: (command: Command) => void;
  /** Global shortcut that toggles the palette. "mod" is Ctrl, or Cmd on a Mac. Pass null to turn it off. */
  hotkey?: string | null;
  placeholder?: string;
  accent?: string;
  className?: string;
}

interface Match {
  command: Command;
  score: number;
  /** Indexes of the matched characters in the label, for highlighting. */
  hits: number[];
}

/**
 * Subsequence match: every query letter must appear in order. Consecutive letters and letters
 * that start a word score higher, so "gs" ranks "Go to Settings" above "Toggle sidebar".
 */
function fuzzy(query: string, command: Command): Match | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { command, score: 0, hits: [] };
  const label = command.label.toLowerCase();
  const hits: number[] = [];
  let score = 0;
  let from = 0;
  for (const ch of q) {
    const i = label.indexOf(ch, from);
    if (i === -1) {
      // Fall back to keywords, without highlights.
      const extra = `${command.keywords ?? ""} ${command.group ?? ""}`.toLowerCase();
      return extra.includes(query.toLowerCase().trim()) ? { command, score: 1, hits: [] } : null;
    }
    score += 1;
    if (hits.length && i === hits[hits.length - 1] + 1) score += 3;
    if (i === 0 || label[i - 1] === " ") score += 4;
    hits.push(i);
    from = i + 1;
  }
  return { command, score: score - label.length * 0.05, hits };
}

function Highlight({ text, hits }: { text: string; hits: number[] }) {
  if (hits.length === 0) return <>{text}</>;
  const set = new Set(hits);
  return (
    <>
      {[...text].map((ch, i) =>
        set.has(i) ? (
          <mark key={i} className="bg-transparent font-semibold text-[var(--cp-accent)]">
            {ch}
          </mark>
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        ),
      )}
    </>
  );
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function matchesHotkey(e: globalThis.KeyboardEvent, hotkey: string) {
  const parts = hotkey.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantMod = parts.includes("mod");
  const mod = isMac() ? e.metaKey : e.ctrlKey;
  return e.key.toLowerCase() === key && (!wantMod || mod) && parts.includes("shift") === e.shiftKey;
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  recentIds = [],
  onRun,
  hotkey = "mod+k",
  placeholder = "Type a command or search…",
  accent = "#a78bfa",
  className = "",
}: CommandPaletteProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<Command[]>([]);
  const [active, setActive] = useState(0);

  // Same native <dialog> approach as the confirm dialog: focus trap, Escape and backdrop for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep typing in the search box after opening or leaving a nested page with the mouse.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, stack]);

  const page = stack[stack.length - 1];
  const pool = page?.children ?? commands;

  // Sections to render: grouped when idle, one ranked list while searching.
  const sections = useMemo(() => {
    if (query.trim()) {
      const ranked = pool
        .map((c) => fuzzy(query, c))
        .filter((m): m is Match => m !== null)
        .sort((a, b) => b.score - a.score);
      return ranked.length ? [{ title: "Results", items: ranked }] : [];
    }
    const out: { title: string; items: Match[] }[] = [];
    if (!page) {
      const recent = recentIds
        .map((rid) => commands.find((c) => c.id === rid))
        .filter((c): c is Command => !!c)
        .map((command) => ({ command, score: 0, hits: [] }));
      if (recent.length) out.push({ title: "Recent", items: recent });
    }
    const groups = new Map<string, Match[]>();
    for (const c of pool) {
      const g = c.group ?? (page ? page.label : "Commands");
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push({ command: c, score: 0, hits: [] });
    }
    for (const [title, items] of groups) out.push({ title, items });
    return out;
  }, [query, pool, page, recentIds, commands]);

  const flat = sections.flatMap((s) => s.items);
  const safeActive = Math.min(active, Math.max(flat.length - 1, 0));

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector(`#${CSS.escape(`${id}-opt-${safeActive}`)}`)?.scrollIntoView({ block: "nearest" });
  }, [safeActive, id]);

  const resetState = () => {
    setQuery("");
    setStack([]);
    setActive(0);
  };

  // Every close from inside resets here. The dialog's close event also resets, as a backup for
  // when the parent closes it, but it isn't relied on alone.
  const close = () => {
    resetState();
    onOpenChange(false);
  };

  // Global shortcut. Kept in a ref so the listener isn't re-added on every render.
  const toggleRef = useRef(() => {});
  useEffect(() => {
    toggleRef.current = () => (open ? close() : onOpenChange(true));
  });
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!matchesHotkey(e, hotkey)) return;
      e.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  const run = (command: Command) => {
    if (command.children?.length) {
      setStack((s) => [...s, command]);
      setQuery("");
      setActive(0);
      return;
    }
    close();
    command.perform?.();
    onRun?.(command);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((safeActive + step + flat.length) % flat.length);
    } else if (e.key === "Home" && e.ctrlKey) {
      setActive(0);
    } else if (e.key === "End" && e.ctrlKey) {
      setActive(flat.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[safeActive]) run(flat[safeActive].command);
    } else if (e.key === "Backspace" && !query && stack.length) {
      e.preventDefault();
      setStack((s) => s.slice(0, -1));
      setActive(0);
    }
  };

  // Index of each section's first row in the flat list, for ids and keyboard focus.
  const starts = sections.map((_, si) => sections.slice(0, si).reduce((n, s) => n + s.items.length, 0));

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onClose={resetState}
      onCancel={(e) => {
        // Escape steps out of a nested page first, then closes.
        e.preventDefault();
        if (stack.length) {
          setStack((s) => s.slice(0, -1));
          setQuery("");
          setActive(0);
        } else close();
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
      style={{ "--cp-accent": accent } as CSSProperties}
      className={[
        "mx-auto mt-[12vh] mb-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-0 text-left text-zinc-100 shadow-2xl",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "transition-[opacity,translate] duration-150 starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-zinc-500" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.13 3.14a.75.75 0 1 0 1.06-1.06l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            clipRule="evenodd"
          />
        </svg>
        {stack.map((s) => (
          <span key={s.id} className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
            {s.label} ›
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={page ? `Search ${page.label.toLowerCase()}…` : placeholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={flat.length ? `${id}-opt-${safeActive}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded border border-zinc-700 px-1.5 py-0.5 font-sans text-[11px] text-zinc-500 sm:block">
          Esc
        </kbd>
      </div>

      <div
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label="Commands"
        className="max-h-[min(60vh,24rem)] overflow-y-auto p-2"
      >
        {flat.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-zinc-500">No commands match “{query}”.</p>
        ) : (
          sections.map((section, si) => (
            <div key={section.title} role="group" aria-labelledby={`${id}-${section.title}`} className="mb-1">
              <p id={`${id}-${section.title}`} className="px-3 pb-1 pt-2 text-xs font-medium text-zinc-500">
                {section.title}
              </p>
              {section.items.map(({ command, hits }, row) => {
                const i = starts[si] + row;
                const selected = i === safeActive;
                return (
                  <div
                    key={`${section.title}-${command.id}`}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => !selected && setActive(i)}
                    onClick={() => run(command)}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                      selected ? "bg-zinc-800 text-zinc-50" : "text-zinc-300",
                    ].join(" ")}
                  >
                    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-zinc-400">
                      {command.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <Highlight text={command.label} hits={hits} />
                    </span>
                    {query && command.group && <span className="shrink-0 text-xs text-zinc-500">{command.group}</span>}
                    {command.children?.length ? (
                      <span aria-hidden="true" className="text-zinc-500">
                        ›
                      </span>
                    ) : (
                      command.shortcut && (
                        <span className="flex shrink-0 gap-1" aria-label={`Shortcut ${command.shortcut.join(" ")}`}>
                          {command.shortcut.map((k) => (
                            <kbd
                              key={k}
                              className="min-w-5 rounded border border-zinc-700 bg-zinc-900 px-1 text-center font-sans text-[11px] text-zinc-400"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-500">
        <span>
          <kbd className="font-sans">↑↓</kbd> move
        </span>
        <span>
          <kbd className="font-sans">Enter</kbd> run
        </span>
        {stack.length > 0 && (
          <span>
            <kbd className="font-sans">Backspace</kbd> back
          </span>
        )}
        <span className="ml-auto" aria-live="polite">
          {flat.length} {flat.length === 1 ? "result" : "results"}
        </span>
      </div>
    </dialog>
  );
}

export default CommandPalette;
