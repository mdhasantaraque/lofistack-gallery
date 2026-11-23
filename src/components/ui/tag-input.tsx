"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface TagInputProps {
  /** Visible label, also the accessible name of the text box. */
  label: string;
  hint?: ReactNode;
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  /** Offered while typing. Matching ignores case and picks up the suggestion's spelling. */
  suggestions?: string[];
  maxTags?: number;
  maxSuggestions?: number;
  /** false: only suggestions can be added. */
  allowCustom?: boolean;
  /** Return a message to reject a tag, or null to accept it. */
  validate?: (tag: string) => string | null;
  caseSensitive?: boolean;
  placeholder?: string;
  /** Adds a hidden input with the tags joined by commas, for plain form posts. */
  name?: string;
  accent?: string;
  className?: string;
}

/** Characters that end a tag. Checked on every change, because phone keyboards often don't report keys. */
const SEPARATORS = /[,;\n]/;

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

export function TagInput({
  label,
  hint,
  value,
  defaultValue = [],
  onChange,
  suggestions = [],
  maxTags,
  maxSuggestions = 6,
  allowCustom = true,
  validate,
  caseSensitive = false,
  placeholder = "Add a tag…",
  name,
  accent = "#a78bfa",
  className = "",
}: TagInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<number | "input" | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(-1);
  const [error, setError] = useState("");
  const [announce, setAnnounce] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const same = (a: string, b: string) => (caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase());
  const has = (list: string[], t: string) => list.some((x) => same(x, t));
  const full = maxTags !== undefined && tags.length >= maxTags;

  const query = clean(text).toLowerCase();
  const options = suggestions
    .filter((s) => !has(tags, s) && (!query || s.toLowerCase().includes(query)))
    .sort((a, b) => Number(b.toLowerCase().startsWith(query)) - Number(a.toLowerCase().startsWith(query)))
    .slice(0, maxSuggestions);
  const showList = open && !full && options.length > 0;
  // With custom tags off, the top match is highlighted from the start, so Enter picks it.
  const active = !showList
    ? -1
    : activeOption >= 0 && activeOption < options.length
      ? activeOption
      : allowCustom
        ? -1
        : 0;

  // Focus moves after the tag list re-renders, e.g. to the neighbouring chip after a delete.
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    if (target === "input") inputRef.current?.focus();
    else (chips.current[target] ?? inputRef.current)?.focus();
  }, [tags]);

  // Keep the highlighted suggestion visible inside the list without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const el = active >= 0 ? (list?.children[active] as HTMLElement | undefined) : undefined;
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const flashTag = (tag: string) => {
    setFlash(tag);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1200);
  };

  /** Adds several tags at once and explains anything it skipped. */
  const addMany = (raw: string[]) => {
    const next = [...tags];
    const added: string[] = [];
    const problems: string[] = [];
    for (const piece of raw) {
      let tag = clean(piece);
      if (!tag) continue;
      const known = suggestions.find((s) => same(s, tag));
      if (known) tag = known;
      if (has(next, tag)) {
        const existing = next.find((x) => same(x, tag)) ?? tag;
        flashTag(existing);
        problems.push(`${existing} is already added`);
        continue;
      }
      if (maxTags !== undefined && next.length >= maxTags) {
        problems.push(`limit of ${maxTags} reached`);
        break;
      }
      if (!allowCustom && !known) {
        problems.push(`${tag} isn't one of the options`);
        continue;
      }
      const message = validate?.(tag);
      if (message) {
        problems.push(message);
        continue;
      }
      next.push(tag);
      added.push(tag);
    }
    if (added.length) commit(next);
    const addedText = added.length === 1 ? `Added ${added[0]}.` : added.length ? `Added ${added.length} tags.` : "";
    setError(problems.length ? capitalize(problems.join("; ")) + "." : "");
    setAnnounce([addedText, problems.length ? capitalize(problems.join("; ")) + "." : ""].filter(Boolean).join(" "));
    return added.length > 0;
  };

  const remove = (index: number, focusAfter: number | "input") => {
    const tag = tags[index];
    pendingFocus.current = focusAfter;
    commit(tags.filter((_, i) => i !== index));
    setAnnounce(`Removed ${tag}.`);
    setError("");
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setError("");
    if (SEPARATORS.test(v)) {
      const parts = v.split(SEPARATORS);
      const rest = parts.pop() ?? "";
      addMany(parts);
      setText(rest);
    } else {
      setText(v);
    }
    setOpen(true);
    setActiveOption(-1);
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!SEPARATORS.test(pasted)) return;
    e.preventDefault();
    addMany((text + pasted).split(SEPARATORS));
    setText("");
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    switch (e.key) {
      case "Enter":
        if (active >= 0) {
          e.preventDefault();
          if (addMany([options[active]])) setText("");
          setActiveOption(-1);
        } else if (clean(text)) {
          // Enter with text adds it instead of submitting the surrounding form.
          e.preventDefault();
          if (addMany([text])) setText("");
        }
        break;
      case "ArrowDown":
      case "ArrowUp": {
        if (!options.length || full) return;
        e.preventDefault();
        setOpen(true);
        const step = e.key === "ArrowDown" ? 1 : -1;
        const from = showList ? active : -1;
        setActiveOption(
          from === -1 && step === -1 ? options.length - 1 : (from + step + options.length) % options.length,
        );
        break;
      }
      case "Escape":
        if (showList) {
          e.preventDefault();
          setOpen(false);
          setActiveOption(-1);
        } else if (text) {
          e.preventDefault();
          setText("");
        }
        break;
      case "Backspace":
      case "ArrowLeft":
        // From the start of the box, step back into the tags: one press selects, the next deletes.
        if (atStart && tags.length) {
          e.preventDefault();
          chips.current[tags.length - 1]?.focus();
          setOpen(false);
        }
        break;
    }
  };

  const onChipKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = tags.length - 1;
    const keys: Record<string, () => void> = {
      Backspace: () => remove(i, i > 0 ? i - 1 : last > 0 ? 0 : "input"),
      Delete: () => remove(i, i < last ? i : "input"),
      ArrowLeft: () => chips.current[Math.max(i - 1, 0)]?.focus(),
      ArrowRight: () => (i < last ? chips.current[i + 1]?.focus() : inputRef.current?.focus()),
      Home: () => chips.current[0]?.focus(),
      End: () => inputRef.current?.focus(),
      Escape: () => inputRef.current?.focus(),
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };

  const pickOption = (option: string) => {
    if (addMany([option])) setText("");
    setActiveOption(-1);
    inputRef.current?.focus();
  };

  const describedBy = [hint && `${id}-hint`, maxTags !== undefined && `${id}-count`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ "--ti-accent": accent } as CSSProperties} className={["relative w-full", className].join(" ")}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={`${id}-input`} className="text-sm font-medium text-zinc-200">
          {label}
        </label>
        {maxTags !== undefined && (
          <span
            id={`${id}-count`}
            className={["text-xs tabular-nums", full ? "text-amber-300" : "text-zinc-500"].join(" ")}
          >
            {tags.length}/{maxTags}
            <span className="sr-only"> tags used</span>
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-zinc-500">
          {hint}
        </p>
      )}

      {/* Clicking the empty part of the box focuses the text field, like a normal input. */}
      <div
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
        className={[
          "mt-2 flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-zinc-900 px-2 py-1.5 transition-colors",
          "has-[input:focus-visible]:border-[var(--ti-accent)] has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[var(--ti-accent)]/30",
          error ? "border-rose-400/70" : "border-zinc-700",
        ].join(" ")}
      >
        <ul role="list" aria-label={`${label}, ${tags.length} added`} className="contents">
          {tags.map((tag, i) => (
            <li
              key={tag}
              className={[
                "flex max-w-full items-center gap-1 rounded-lg py-0.5 pl-2.5 pr-1 text-sm transition-colors",
                flash === tag ? "bg-amber-400/25 text-amber-100 ring-1 ring-amber-300" : "bg-zinc-800 text-zinc-100",
                "has-[button:focus-visible]:bg-[var(--ti-accent)]/25 has-[button:focus-visible]:ring-1 has-[button:focus-visible]:ring-[var(--ti-accent)]",
              ].join(" ")}
            >
              <span className="truncate">{tag}</span>
              <button
                ref={(el) => {
                  chips.current[i] = el;
                }}
                type="button"
                tabIndex={-1}
                aria-label={`Remove ${tag}`}
                aria-keyshortcuts="Backspace Delete"
                onClick={() => remove(i, "input")}
                onKeyDown={(e) => onChipKey(e, i)}
                className="grid size-5 shrink-0 place-items-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-zinc-50 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-3"
                  aria-hidden="true"
                >
                  <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          enterKeyHint="enter"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={text}
          placeholder={full ? "Limit reached" : tags.length ? "" : placeholder}
          onChange={onInputChange}
          onPaste={onPaste}
          onKeyDown={onInputKey}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActiveOption(-1);
          }}
          className="h-8 min-w-[8ch] flex-1 bg-transparent px-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
      </div>

      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={`${label} suggestions`}
        hidden={!showList}
        className="absolute inset-x-0 z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl shadow-black/40"
      >
        {options.map((o, i) => (
          <li
            key={o}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            // Keep focus in the text box, so picking with the mouse doesn't blur and close first.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickOption(o)}
            className={[
              "cursor-pointer rounded-lg px-3 py-2 text-sm",
              i === active ? "bg-[var(--ti-accent)]/20 text-zinc-50" : "text-zinc-300 hover:bg-zinc-800",
            ].join(" ")}
          >
            <Highlight text={o} query={query} />
          </li>
        ))}
      </ul>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {name && <input type="hidden" name={name} value={tags.join(",")} />}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Bolds the part of a suggestion that matches what was typed. */
function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1;
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-[var(--ti-accent)]">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

export default TagInput;
