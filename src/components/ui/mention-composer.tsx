"use client";

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface MentionUser {
  id: string;
  name: string;
  /** Inserted as @handle. Letters, numbers, dots and underscores. */
  handle: string;
  role?: string;
  /** Any CSS color for the initials avatar. */
  color?: string;
}

export interface ComposerPayload {
  text: string;
  /** Everyone whose @handle is still in the text when it's sent. */
  mentions: MentionUser[];
}

export interface MentionComposerProps {
  users: MentionUser[];
  /** Accessible label, shown above the box. */
  label: string;
  placeholder?: string;
  maxLength?: number;
  /** May return a promise. The text clears on success; a rejection shows its message. */
  onSubmit: (payload: ComposerPayload) => void | Promise<void>;
  submitLabel?: string;
  /** Max suggestions in the list. */
  maxSuggestions?: number;
  accent?: string;
  className?: string;
}

interface Trigger {
  /** Index of the @ in the text. */
  start: number;
  query: string;
}

const HANDLE = /@([a-z0-9_.]+)/gi;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function findTrigger(value: string, caret: number): Trigger | null {
  const match = value.slice(0, caret).match(/(?:^|\s)@([\w.]{0,24})$/);
  return match ? { start: caret - match[1].length - 1, query: match[1] } : null;
}

export function MentionComposer({
  users,
  label,
  placeholder = "Write a comment… type @ to mention someone",
  maxLength = 280,
  onSubmit,
  submitLabel = "Comment",
  maxSuggestions = 6,
  accent = "#a78bfa",
  className = "",
}: MentionComposerProps) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byHandle = useMemo(() => new Map(users.map((u) => [u.handle.toLowerCase(), u])), [users]);

  const suggestions = useMemo(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    const score = (u: MentionUser) => {
      const handle = u.handle.toLowerCase();
      const name = u.name.toLowerCase();
      if (handle.startsWith(q) || name.startsWith(q)) return 0;
      if (name.split(/\s+/).some((part) => part.startsWith(q))) return 1;
      if (handle.includes(q) || name.includes(q)) return 2;
      return -1;
    };
    return users
      .map((u) => ({ u, s: score(u) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s || a.u.name.localeCompare(b.u.name))
      .slice(0, maxSuggestions)
      .map((x) => x.u);
  }, [trigger, users, maxSuggestions]);

  const listOpen = trigger !== null && suggestions.length > 0;
  const mentioned = useMemo(() => {
    const seen = new Map<string, MentionUser>();
    for (const m of value.matchAll(HANDLE)) {
      const user = byHandle.get(m[1].toLowerCase());
      if (user) seen.set(user.id, user);
    }
    return [...seen.values()];
  }, [value, byHandle]);

  // Put the caret right after an inserted mention once React has written the new text.
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (ta && pendingCaret.current !== null) {
      ta.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value]);

  const syncTrigger = (text: string, caret: number) => {
    const next = findTrigger(text, caret);
    setTrigger(next);
    if (next?.start !== trigger?.start || next?.query !== trigger?.query) setActiveIndex(0);
  };

  const insert = (user: MentionUser) => {
    const ta = textareaRef.current;
    if (!ta || !trigger) return;
    const caret = ta.selectionStart;
    const before = value.slice(0, trigger.start);
    const after = value.slice(caret).replace(/^\s*/, "");
    const mention = `@${user.handle} `;
    pendingCaret.current = before.length + mention.length;
    setValue(before + mention + after);
    setTrigger(null);
    ta.focus();
  };

  const submit = async () => {
    const text = value.trim();
    if (!text || text.length > maxLength || pending) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit({ text, mentions: mentioned });
      setValue("");
      setTrigger(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that. Try again.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
      return;
    }
    if (!listOpen) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTrigger(null);
    }
  };

  // Mirror of the text behind the textarea, with known mentions painted as pills.
  const mirror: ReactNode[] = [];
  let last = 0;
  for (const m of value.matchAll(HANDLE)) {
    if (!byHandle.has(m[1].toLowerCase())) continue;
    mirror.push(value.slice(last, m.index));
    mirror.push(
      <mark
        key={m.index}
        className="rounded bg-[color-mix(in_oklab,var(--mc-accent)_28%,transparent)] text-transparent"
      >
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
  }
  mirror.push(value.slice(last) + "​");

  const length = value.length;
  const ratio = Math.min(length / maxLength, 1);
  const over = length > maxLength;
  const remaining = maxLength - length;
  const ringColor = over ? "#f87171" : ratio >= 0.9 ? "#fbbf24" : "var(--mc-accent)";
  const RADIUS = 9;
  const CIRC = 2 * Math.PI * RADIUS;
  const textBox = "px-3.5 py-3 text-sm leading-6 whitespace-pre-wrap break-words";

  return (
    <div style={{ "--mc-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      <label htmlFor={`${id}-input`} className="text-sm font-medium text-zinc-200">
        {label}
      </label>

      <div className="relative mt-2 rounded-xl border border-zinc-700 bg-zinc-900 transition-colors focus-within:border-[var(--mc-accent)]">
        <div className="relative">
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className={`${textBox} pointer-events-none absolute inset-0 overflow-hidden border border-transparent text-transparent`}
          >
            {mirror}
          </div>
          <textarea
            ref={textareaRef}
            id={`${id}-input`}
            value={value}
            placeholder={placeholder}
            disabled={pending}
            rows={3}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={listOpen}
            aria-controls={`${id}-list`}
            aria-activedescendant={listOpen ? `${id}-opt-${activeIndex}` : undefined}
            aria-describedby={`${id}-help`}
            aria-invalid={over || undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              syncTrigger(e.target.value, e.target.selectionStart);
            }}
            onSelect={(e) => syncTrigger(e.currentTarget.value, e.currentTarget.selectionStart)}
            onKeyDown={onKeyDown}
            onBlur={() => setTrigger(null)}
            onScroll={(e) => {
              if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            className={`${textBox} relative block max-h-60 min-h-24 w-full resize-none border border-transparent bg-transparent text-zinc-100 placeholder:text-zinc-500 field-sizing-content focus:outline-none disabled:opacity-60`}
          />
        </div>

        {listOpen && (
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label="People"
            className="absolute inset-x-2 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
          >
            {suggestions.map((user, i) => (
              <li
                key={user.id}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // mousedown, not click, so the textarea doesn't blur and close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  insert(user);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2",
                  i === activeIndex ? "bg-zinc-800" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-zinc-950"
                  style={{ background: user.color ?? accent }}
                >
                  {initials(user.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-zinc-100">{user.name}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    @{user.handle}
                    {user.role ? ` · ${user.role}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-3 py-2">
          <p id={`${id}-help`} className="min-w-0 truncate text-xs text-zinc-500">
            {mentioned.length > 0 ? (
              <>
                Will notify <span className="text-zinc-300">{mentioned.map((u) => u.name).join(", ")}</span>
              </>
            ) : (
              <>
                <kbd className="font-sans">@</kbd> to mention · <kbd className="font-sans">Ctrl</kbd>+
                <kbd className="font-sans">Enter</kbd> to send
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <span className="relative grid size-7 place-items-center" aria-hidden={remaining > 20}>
              <svg viewBox="0 0 24 24" className="absolute inset-0 size-7 -rotate-90">
                <circle cx="12" cy="12" r={RADIUS} fill="none" stroke="rgb(63 63 70)" strokeWidth="2.5" />
                <circle
                  cx="12"
                  cy="12"
                  r={RADIUS}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - ratio)}
                  className="transition-[stroke-dashoffset] duration-200 motion-reduce:transition-none"
                />
              </svg>
              {remaining <= 20 && (
                <span
                  className={["text-[10px] font-semibold tabular-nums", over ? "text-red-300" : "text-amber-300"].join(
                    " ",
                  )}
                >
                  {remaining}
                  <span className="sr-only"> characters left</span>
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!value.trim() || over || pending}
              className="h-8 rounded-lg bg-[var(--mc-accent)] px-3.5 text-sm font-semibold text-zinc-950 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Posting…" : submitLabel}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default MentionComposer;
