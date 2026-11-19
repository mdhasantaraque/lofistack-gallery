"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

export type ChangeKind = "new" | "improved" | "fixed" | "security";

export interface ChangelogEntry {
  /** Version string, also used for the link to this release (#v2-4-0). */
  version: string;
  /** Release date as YYYY-MM-DD. Read as UTC so it shows the same day everywhere. */
  date: string;
  title: string;
  summary?: string;
  changes: { kind: ChangeKind; text: string }[];
}

export interface ChangelogSectionProps {
  entries: ChangelogEntry[];
  title?: string;
  description?: string;
  /** Releases shown at first and added by each "Load older" click. */
  pageSize?: number;
  /** Changes shown per release before "Show N more". */
  collapseAfter?: number;
  locale?: string;
  accent?: string;
  className?: string;
}

const KINDS: { kind: ChangeKind; label: string; className: string }[] = [
  { kind: "new", label: "New", className: "bg-emerald-500/15 text-emerald-300" },
  { kind: "improved", label: "Improved", className: "bg-sky-500/15 text-sky-300" },
  { kind: "fixed", label: "Fixed", className: "bg-amber-500/15 text-amber-300" },
  { kind: "security", label: "Security", className: "bg-red-500/15 text-red-300" },
];
const KIND = Object.fromEntries(KINDS.map((k) => [k.kind, k])) as Record<ChangeKind, (typeof KINDS)[number]>;

const anchorFor = (version: string) => `v${version.replace(/^v/i, "").replace(/[^\w]+/g, "-")}`;
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

export function ChangelogSection({
  entries,
  title = "Changelog",
  description,
  pageSize = 3,
  collapseAfter = 4,
  locale = "en-US",
  accent = "#a78bfa",
  className = "",
}: ChangelogSectionProps) {
  const id = useId();
  const [active, setActive] = useState<Set<ChangeKind>>(new Set());
  const [shown, setShown] = useState(pageSize);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const focusFrom = useRef<number | null>(null);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries]);
  const latest = sorted[0]?.version;

  // With filters on, each release keeps only matching changes, and releases with none drop out.
  const filtered = useMemo(
    () =>
      sorted
        .map((e) => ({ ...e, changes: active.size ? e.changes.filter((c) => active.has(c.kind)) : e.changes }))
        .filter((e) => e.changes.length > 0),
    [sorted, active],
  );
  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - visible.length;

  const counts = useMemo(() => {
    const c: Record<ChangeKind, number> = { new: 0, improved: 0, fixed: 0, security: 0 };
    for (const e of entries) for (const ch of e.changes) c[ch.kind] += 1;
    return c;
  }, [entries]);

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
    [locale],
  );

  // After "Load older", move focus to the first newly shown release so keyboard users keep their place.
  useEffect(() => {
    if (focusFrom.current === null) return;
    const target = visible[focusFrom.current];
    focusFrom.current = null;
    if (target) document.getElementById(`${id}-${anchorFor(target.version)}-title`)?.focus();
  }, [visible, id]);

  const toggleKind = (kind: ChangeKind) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
    setShown(pageSize);
  };

  const copyLink = async (version: string) => {
    const url = new URL(window.location.href);
    url.hash = anchorFor(version);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(version);
      window.setTimeout(() => setCopied((c) => (c === version ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  };

  const chip = (on: boolean) =>
    [
      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-accent)]",
      on
        ? "border-[var(--cl-accent)] bg-[color-mix(in_oklab,var(--cl-accent)_15%,transparent)] text-zinc-50"
        : "border-zinc-700 text-zinc-400 hover:text-zinc-100",
    ].join(" ");

  return (
    <section
      aria-labelledby={`${id}-title`}
      style={{ "--cl-accent": accent } as CSSProperties}
      className={["w-full", className].join(" ")}
    >
      <div className="max-w-2xl">
        <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-zinc-400">{description}</p>}
      </div>

      <div role="group" aria-label="Filter changes by type" className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={active.size === 0}
          onClick={() => setActive(new Set())}
          className={chip(active.size === 0)}
        >
          All
        </button>
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            aria-pressed={active.has(k.kind)}
            onClick={() => toggleKind(k.kind)}
            className={chip(active.has(k.kind))}
          >
            {k.label} <span className="text-xs text-zinc-500">{counts[k.kind]}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-500" aria-live="polite">
        {active.size === 0
          ? `${sorted.length} releases`
          : `${filtered.length} release${filtered.length === 1 ? "" : "s"} with ${[...active].map((k) => KIND[k].label.toLowerCase()).join(" or ")} changes`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-400">
          No releases match these filters.
        </p>
      ) : (
        <ol className="relative mt-8 space-y-10 border-l border-zinc-800 pl-6 sm:ml-36 sm:pl-8" role="list">
          {visible.map((entry, i) => {
            const anchor = anchorFor(entry.version);
            const month = monthFmt.format(utc(entry.date));
            const newMonth = i === 0 || monthFmt.format(utc(visible[i - 1].date)) !== month;
            const isOpen = open.has(entry.version);
            const changes = isOpen ? entry.changes : entry.changes.slice(0, collapseAfter);
            const hiddenChanges = entry.changes.length - collapseAfter;
            return (
              <li key={entry.version} id={anchor} className="relative scroll-mt-24">
                {/* Month label sits in the left gutter on wide screens, above the entry on phones. */}
                {newMonth && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:absolute sm:-left-44 sm:top-1 sm:mb-0 sm:w-32 sm:text-right">
                    {month}
                  </p>
                )}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute -left-[1.85rem] top-2 size-3 rounded-full border-2 border-zinc-950 sm:-left-[2.35rem]",
                    newMonth ? "max-sm:top-9" : "",
                    entry.version === latest
                      ? "bg-[var(--cl-accent)] ring-4 ring-[color-mix(in_oklab,var(--cl-accent)_25%,transparent)]"
                      : "bg-zinc-600",
                  ].join(" ")}
                />
                <article aria-labelledby={`${id}-${anchor}-title`}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-200">
                      {entry.version}
                    </span>
                    {entry.version === latest && (
                      <span className="rounded-full bg-[var(--cl-accent)] px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                        Latest
                      </span>
                    )}
                    <time dateTime={entry.date} className="text-zinc-500">
                      {dayFmt.format(utc(entry.date))}
                    </time>
                    <button
                      type="button"
                      onClick={() => copyLink(entry.version)}
                      className="ml-auto rounded text-xs text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-accent)]"
                    >
                      <span aria-live="polite">{copied === entry.version ? "Link copied" : "Copy link"}</span>
                      <span className="sr-only"> to {entry.version}</span>
                    </button>
                  </div>
                  <h3
                    id={`${id}-${anchor}-title`}
                    tabIndex={-1}
                    className="mt-2 text-lg font-semibold text-zinc-50 focus:outline-none focus-visible:underline"
                  >
                    {entry.title}
                  </h3>
                  {entry.summary && <p className="mt-1 text-sm leading-relaxed text-zinc-400">{entry.summary}</p>}
                  <ul className="mt-4 space-y-2" role="list" id={`${id}-${anchor}-changes`}>
                    {changes.map((c, ci) => (
                      <li key={ci} className="flex items-start gap-3 text-sm text-zinc-300">
                        <span
                          className={`mt-0.5 w-[4.75rem] shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${KIND[c.kind].className}`}
                        >
                          {KIND[c.kind].label}
                        </span>
                        <span className="leading-relaxed">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                  {hiddenChanges > 0 && (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${id}-${anchor}-changes`}
                      onClick={() =>
                        setOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(entry.version)) next.delete(entry.version);
                          else next.add(entry.version);
                          return next;
                        })
                      }
                      className="mt-3 rounded text-sm font-medium text-[var(--cl-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-accent)]"
                    >
                      {isOpen ? "Show less" : `Show ${hiddenChanges} more`}
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {remaining > 0 && (
        <div className="mt-10 text-center sm:ml-36">
          <button
            type="button"
            onClick={() => {
              focusFrom.current = shown;
              setShown((s) => s + pageSize);
            }}
            className="h-10 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-accent)]"
          >
            Load older releases <span className="text-zinc-500">({remaining})</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default ChangelogSection;
