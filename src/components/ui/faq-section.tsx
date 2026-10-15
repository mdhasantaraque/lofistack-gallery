"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export interface FaqItem {
  /** Used for the deep link: #faq-{id}. */
  id: string;
  question: string;
  /** Plain text. Blank lines start a new paragraph. Searched and highlighted. */
  answer: string;
  category?: string;
  /** Extra words that should find this item, e.g. synonyms. Not shown. */
  keywords?: string;
}

export interface FaqSectionProps {
  title?: string;
  description?: string;
  items: FaqItem[];
  /** Only one answer open at a time when false. */
  allowMultiple?: boolean;
  defaultOpen?: string[];
  /** Keep the open question in the URL hash, and open it when the page loads with that hash. */
  deepLink?: boolean;
  /** Shows "Was this helpful?" under each answer. */
  onFeedback?: (id: string, helpful: boolean) => void;
  /** Shown when the search finds nothing, e.g. a contact link. */
  emptyState?: ReactNode;
  accent?: string;
  className?: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded-sm bg-[color-mix(in_oklab,var(--faq-accent)_35%,transparent)] px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function FaqSection({
  title = "Frequently asked questions",
  description,
  items,
  allowMultiple = true,
  defaultOpen = [],
  deepLink = true,
  onFeedback,
  emptyState,
  accent = "#a78bfa",
  className = "",
}: FaqSectionProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) if (item.category) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return [...counts.entries()];
  }, [items]);

  const q = query.trim();
  const results = useMemo(() => {
    const needle = q.toLowerCase();
    return items.filter(
      (item) =>
        (!category || item.category === category) &&
        (!needle || `${item.question} ${item.answer} ${item.keywords ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [items, category, q]);

  // While searching, every match opens so the highlighted text is visible.
  const isOpen = (itemId: string) => (q ? true : open.has(itemId));

  // Open the item named in the URL hash on load and whenever the hash changes.
  useEffect(() => {
    if (!deepLink) return;
    const fromHash = () => {
      const match = window.location.hash.match(/^#faq-(.+)$/);
      const item = match && items.find((i) => i.id === decodeURIComponent(match[1]));
      if (!item) return;
      setQuery("");
      setCategory(null);
      setOpen((prev) => (allowMultiple ? new Set(prev).add(item.id) : new Set([item.id])));
      window.setTimeout(() => {
        const el = document.getElementById(`faq-${item.id}`);
        el?.scrollIntoView({ block: "start" });
        el?.querySelector("button")?.focus({ preventScroll: true });
      }, 50);
    };
    const initial = window.setTimeout(fromHash, 0);
    window.addEventListener("hashchange", fromHash);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [deepLink, items, allowMultiple]);

  const toggle = (itemId: string) => {
    if (q) return;
    const willOpen = !open.has(itemId);
    setOpen((prev) => {
      const next = allowMultiple ? new Set(prev) : new Set<string>();
      if (willOpen) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
    if (deepLink) {
      const url = new URL(window.location.href);
      url.hash = willOpen ? `faq-${itemId}` : "";
      // replaceState doesn't fire hashchange, so this won't loop back into fromHash.
      window.history.replaceState(null, "", url);
    }
  };

  const allOpen = results.length > 0 && results.every((r) => open.has(r.id));
  const setAll = (expand: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      for (const r of results) {
        if (expand) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });

  /** Up/Down/Home/End move between questions, as in the WAI-ARIA accordion pattern. */
  const onHeaderKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const buttons = [
      ...(e.currentTarget.closest("[data-faq-list]")?.querySelectorAll<HTMLButtonElement>("[data-faq-trigger]") ?? []),
    ];
    const i = buttons.indexOf(e.currentTarget);
    const target =
      e.key === "ArrowDown"
        ? buttons[(i + 1) % buttons.length]
        : e.key === "ArrowUp"
          ? buttons[(i - 1 + buttons.length) % buttons.length]
          : e.key === "Home"
            ? buttons[0]
            : e.key === "End"
              ? buttons[buttons.length - 1]
              : null;
    if (!target) return;
    e.preventDefault();
    target.focus();
  };

  const copyLink = async (itemId: string) => {
    const url = new URL(window.location.href);
    url.hash = `faq-${itemId}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(itemId);
      window.setTimeout(() => setCopied((c) => (c === itemId ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  };

  const chip = (active: boolean) =>
    [
      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faq-accent)]",
      active
        ? "border-[var(--faq-accent)] bg-[color-mix(in_oklab,var(--faq-accent)_15%,transparent)] text-zinc-50"
        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100",
    ].join(" ");

  return (
    <section
      aria-labelledby={`${id}-title`}
      style={{ "--faq-accent": accent } as CSSProperties}
      className={["w-full", className].join(" ")}
    >
      <div className="max-w-2xl">
        <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-zinc-400">{description}</p>}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search questions</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.13 3.14a.75.75 0 1 0 1.06-1.06l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-describedby={`${id}-count`}
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[var(--faq-accent)] focus-visible:outline-none"
          />
        </label>
        {!q && (
          <button
            type="button"
            onClick={() => setAll(!allOpen)}
            disabled={results.length === 0}
            className="h-10 shrink-0 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faq-accent)] disabled:opacity-50"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div role="group" aria-label="Filter by topic" className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className={chip(category === null)}
          >
            All <span className="text-xs text-zinc-500">{items.length}</span>
          </button>
          {categories.map(([name, count]) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(category === name ? null : name)}
              className={chip(category === name)}
            >
              {name} <span className="text-xs text-zinc-500">{count}</span>
            </button>
          ))}
        </div>
      )}

      <p id={`${id}-count`} className="mt-4 text-sm text-zinc-500" aria-live="polite">
        {q || category
          ? `${results.length} ${results.length === 1 ? "answer" : "answers"}${q ? ` for “${q}”` : ""}${category ? ` in ${category}` : ""}`
          : `${items.length} questions`}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 p-8 text-center">
          <p className="font-medium text-zinc-200">No answers match that yet.</p>
          <div className="mt-2 text-sm text-zinc-400">{emptyState}</div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            className="mt-4 rounded text-sm font-medium text-[var(--faq-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faq-accent)]"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul data-faq-list className="mt-2 divide-y divide-zinc-800 border-y border-zinc-800" role="list">
          {results.map((item) => {
            const expanded = isOpen(item.id);
            const panelId = `${id}-panel-${item.id}`;
            const triggerId = `${id}-trigger-${item.id}`;
            return (
              <li key={item.id} id={`faq-${item.id}`} className="scroll-mt-24">
                <h3>
                  <button
                    id={triggerId}
                    type="button"
                    data-faq-trigger
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                    onKeyDown={onHeaderKeyDown}
                    className="group flex w-full items-start justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--faq-accent)]"
                  >
                    <span className="font-medium text-zinc-100 group-hover:text-white">
                      <Highlight text={item.question} query={q} />
                    </span>
                    <span
                      aria-hidden="true"
                      className={[
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-zinc-700 text-zinc-400 transition-transform duration-300 motion-reduce:transition-none",
                        expanded ? "rotate-45 border-[var(--faq-accent)] text-[var(--faq-accent)]" : "",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M6 2v8M2 6h8" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>
                {/* Animates height by moving the grid row from 0fr to 1fr. inert hides closed answers from Tab and readers. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  inert={!expanded}
                  className={[
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                    expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-3 pb-5 pr-10 text-sm leading-relaxed text-zinc-400">
                      {item.answer.split(/\n\s*\n/).map((para, i) => (
                        <p key={i}>
                          <Highlight text={para} query={q} />
                        </p>
                      ))}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-zinc-500">
                        {onFeedback &&
                          (item.id in feedback ? (
                            <span role="status">Thanks for the feedback.</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Was this helpful?
                              {[true, false].map((helpful) => (
                                <button
                                  key={String(helpful)}
                                  type="button"
                                  onClick={() => {
                                    setFeedback((f) => ({ ...f, [item.id]: helpful }));
                                    onFeedback(item.id, helpful);
                                  }}
                                  className="rounded-md border border-zinc-700 px-2 py-0.5 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faq-accent)]"
                                >
                                  {helpful ? "Yes" : "No"}
                                </button>
                              ))}
                            </span>
                          ))}
                        {deepLink && (
                          <button
                            type="button"
                            onClick={() => copyLink(item.id)}
                            className="rounded text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faq-accent)]"
                          >
                            <span aria-live="polite">{copied === item.id ? "Link copied" : "Copy link"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default FaqSection;
