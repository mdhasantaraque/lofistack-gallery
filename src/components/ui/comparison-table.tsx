"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

/** true / false, "partial", or any text or number shown as is. */
export type ComparisonValue = boolean | "partial" | string | number | null;

export interface ComparisonPlan {
  id: string;
  name: string;
  price?: string;
  /** Under the price, e.g. "per seat / month". */
  note?: string;
  badge?: string;
  /** Tinted column and filled button. */
  highlighted?: boolean;
  cta?: { label: string; href?: string; onClick?: () => void };
}

export interface ComparisonFeature {
  id: string;
  label: string;
  /** Short explanation shown in a tooltip next to the label. */
  hint?: string;
  values: Record<string, ComparisonValue>;
}

export interface ComparisonGroup {
  id: string;
  label: string;
  features: ComparisonFeature[];
}

export interface ComparisonTableProps {
  plans: ComparisonPlan[];
  groups: ComparisonGroup[];
  /** Accessible name of the table. */
  caption: string;
  defaultCollapsed?: string[];
  /** Max height before the table scrolls inside itself, so the header can stick. */
  maxHeight?: string;
  accent?: string;
  className?: string;
}

function Cell({ value }: { value: ComparisonValue }) {
  if (value === true)
    return (
      <>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mx-auto size-5 text-[var(--ct-accent)]"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only">Included</span>
      </>
    );
  if (value === false || value === null)
    return (
      <>
        <span aria-hidden="true" className="text-zinc-600">
          —
        </span>
        <span className="sr-only">Not included</span>
      </>
    );
  if (value === "partial")
    return (
      <>
        <svg viewBox="0 0 20 20" className="mx-auto size-5" aria-hidden="true">
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500" />
          <path d="M10 3a7 7 0 0 1 0 14Z" className="fill-[var(--ct-accent)]" />
        </svg>
        <span className="sr-only">Partly included</span>
      </>
    );
  return <span className="text-sm text-zinc-200">{value}</span>;
}

const same = (a: ComparisonValue, b: ComparisonValue) => (a ?? false) === (b ?? false);

export function ComparisonTable({
  plans,
  groups,
  caption,
  defaultCollapsed = [],
  maxHeight = "70vh",
  accent = "#a78bfa",
  className = "",
}: ComparisonTableProps) {
  const id = useId();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(defaultCollapsed));
  const [onlyDiff, setOnlyDiff] = useState(false);
  // On phones only one plan column is shown at a time; this picks which.
  const [mobilePlan, setMobilePlan] = useState(plans.find((p) => p.highlighted)?.id ?? plans[0]?.id);

  const toggleGroup = (gid: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });

  const visibleFeatures = (g: ComparisonGroup) =>
    onlyDiff ? g.features.filter((f) => plans.some((p) => !same(f.values[p.id], f.values[plans[0].id]))) : g.features;

  const hiddenCount = onlyDiff ? groups.reduce((n, g) => n + g.features.length - visibleFeatures(g).length, 0) : 0;

  // On small screens every plan column except the picked one is hidden.
  const colClass = (p: ComparisonPlan) =>
    [
      p.id === mobilePlan ? "" : "max-sm:hidden",
      // Solid, not see-through, so rows scrolling under the sticky header stay hidden.
      p.highlighted ? "bg-[color-mix(in_oklab,var(--ct-accent)_7%,#09090b)]" : "",
    ].join(" ");

  const cta = (p: ComparisonPlan): ReactNode => {
    if (!p.cta) return null;
    const cls = [
      "inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold sm:px-3 transition-[filter,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ct-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      p.highlighted
        ? "bg-[var(--ct-accent)] text-zinc-950 hover:brightness-110"
        : "border border-zinc-700 text-zinc-100 hover:bg-zinc-800",
    ].join(" ");
    return p.cta.href ? (
      <a href={p.cta.href} onClick={p.cta.onClick} className={cls}>
        {p.cta.label}
        <span className="sr-only"> ({p.name})</span>
      </a>
    ) : (
      <button type="button" onClick={p.cta.onClick} className={cls}>
        {p.cta.label}
        <span className="sr-only"> ({p.name})</span>
      </button>
    );
  };

  return (
    <div style={{ "--ct-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Plan to show"
          className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1 sm:hidden"
        >
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === mobilePlan}
              onClick={() => setMobilePlan(p.id)}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ct-accent)]",
                p.id === mobilePlan ? "bg-zinc-100 text-zinc-950" : "text-zinc-400",
              ].join(" ")}
            >
              {p.name}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300 sm:ml-auto">
          <button
            type="button"
            role="switch"
            aria-checked={onlyDiff}
            onClick={() => setOnlyDiff((v) => !v)}
            className={[
              "relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ct-accent)] motion-reduce:transition-none",
              onlyDiff ? "bg-[var(--ct-accent)]" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "absolute top-0.5 size-4 rounded-full bg-white transition-[left] motion-reduce:transition-none",
                onlyDiff ? "left-[1.125rem]" : "left-0.5",
              ].join(" ")}
            />
          </button>
          Only show differences
        </label>
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-800" style={{ maxHeight }}>
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">
            {caption}
            {hiddenCount > 0 ? `. ${hiddenCount} rows that are the same on every plan are hidden.` : ""}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-30 min-w-40 border-b border-zinc-800 bg-zinc-950 p-4 align-bottom text-xs font-medium uppercase tracking-wider text-zinc-500 sm:w-[34%]"
              >
                Features
              </th>
              {plans.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className={`sticky top-0 z-20 min-w-36 border-b border-zinc-800 p-2 text-center align-bottom sm:p-4 ${p.highlighted ? "" : "bg-zinc-950"} ${colClass(p)}`}
                >
                  <div
                    className={
                      p.highlighted ? "rounded-xl bg-[color-mix(in_oklab,var(--ct-accent)_10%,transparent)] p-2" : "p-2"
                    }
                  >
                    {p.badge && (
                      <span className="mb-2 inline-block rounded-full bg-[var(--ct-accent)] px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-base font-semibold text-zinc-50">{p.name}</p>
                    {p.price && <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-50">{p.price}</p>}
                    {p.note && <p className="text-xs font-normal text-zinc-500">{p.note}</p>}
                    <div className="mt-3 font-normal">{cta(p)}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {groups.map((g) => {
            const features = visibleFeatures(g);
            const isCollapsed = collapsed.has(g.id);
            if (onlyDiff && features.length === 0) return null;
            return (
              <tbody key={g.id} id={`${id}-${g.id}`}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={plans.length + 1}
                    className="sticky left-0 border-b border-zinc-800 bg-zinc-900/95 p-0 text-left"
                  >
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      aria-controls={`${id}-${g.id}`}
                      onClick={() => toggleGroup(g.id)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ct-accent)]"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={[
                          "size-4 transition-transform motion-reduce:transition-none",
                          isCollapsed ? "-rotate-90" : "",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {g.label}
                      <span className="font-normal normal-case tracking-normal text-zinc-500">
                        {features.length} {features.length === 1 ? "feature" : "features"}
                      </span>
                    </button>
                  </th>
                </tr>
                {!isCollapsed &&
                  features.map((f) => (
                    <tr key={f.id} className="group/row">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-b border-zinc-800/70 bg-zinc-950 px-4 py-3 font-normal text-zinc-300 group-hover/row:bg-zinc-900"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {f.label}
                          {f.hint && (
                            <span className="group/hint relative inline-flex">
                              <button
                                type="button"
                                aria-describedby={`${id}-hint-${f.id}`}
                                className="grid size-4 place-items-center rounded-full border border-zinc-600 text-[10px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ct-accent)]"
                              >
                                ?<span className="sr-only">About {f.label}</span>
                              </button>
                              <span
                                id={`${id}-hint-${f.id}`}
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-200 opacity-0 shadow-xl transition-opacity group-focus-within/hint:opacity-100 group-hover/hint:opacity-100"
                              >
                                {f.hint}
                              </span>
                            </span>
                          )}
                        </span>
                      </th>
                      {plans.map((p) => (
                        <td
                          key={p.id}
                          className={`border-b border-zinc-800/70 px-4 py-3 text-center group-hover/row:bg-zinc-900/60 ${colClass(p)}`}
                        >
                          <Cell value={f.values[p.id] ?? null} />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            );
          })}
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
        {hiddenCount > 0
          ? `${hiddenCount} row${hiddenCount === 1 ? "" : "s"} that are the same on every plan are hidden.`
          : "Showing every feature."}
      </p>
    </div>
  );
}

export default ComparisonTable;
