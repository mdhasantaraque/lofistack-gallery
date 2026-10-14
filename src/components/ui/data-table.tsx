"use client";

import { useId, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

type CellValue = string | number | Date | null | undefined;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Raw value used for sorting and search. */
  value: (row: T) => CellValue;
  /** Custom cell content. Defaults to the raw value as text. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
  /** Can be hidden from the Columns menu. */
  hideable?: boolean;
  /** Included in the search box. Defaults to true for string values. */
  searchable?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Accessible table name, shown visually above the table. */
  caption: string;
  pageSizeOptions?: number[];
  selectable?: boolean;
  /** Rendered in the bar that appears when rows are selected. */
  bulkActions?: (selected: T[], clearSelection: () => void) => ReactNode;
  emptyMessage?: string;
  accent?: string;
  className?: string;
}

type SortRule = { key: string; dir: "asc" | "desc" };

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function compare(a: CellValue, b: CellValue) {
  // Empty values always sink to the bottom, whatever the direction.
  if (a == null || a === "") return b == null || b === "" ? 0 : 1;
  if (b == null || b === "") return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

function SortIcon({ dir }: { dir?: "asc" | "desc" }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
      <path d="M6 2 9 5H3z" fill="currentColor" opacity={dir === "asc" ? 1 : 0.3} />
      <path d="M6 10 3 7h6z" fill="currentColor" opacity={dir === "desc" ? 1 : 0.3} />
    </svg>
  );
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  caption,
  pageSizeOptions = [5, 10, 25],
  selectable = true,
  bulkActions,
  emptyMessage = "No rows match your search.",
  accent = "#818cf8",
  className = "",
}: DataTableProps<T>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortRule[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);
  const [dense, setDense] = useState(false);
  const anchor = useRef<string | null>(null);

  const visibleColumns = columns.filter((c) => !hidden.has(c.key));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const searchCols = columns.filter((c) => c.searchable ?? true);
    return rows.filter((row) =>
      searchCols.some((c) => {
        const v = c.value(row);
        return v != null && (v instanceof Date ? v.toISOString() : String(v)).toLowerCase().includes(q);
      }),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (sort.length === 0) return filtered;
    const byKey = new Map(columns.map((c) => [c.key, c]));
    return [...filtered].sort((a, b) => {
      for (const rule of sort) {
        const col = byKey.get(rule.key);
        if (!col) continue;
        const va = col.value(a);
        const vb = col.value(b);
        const empty = (v: CellValue) => v == null || v === "";
        // Keep empties last in both directions.
        if (empty(va) || empty(vb)) {
          const c = compare(va, vb);
          if (c !== 0) return c;
          continue;
        }
        const c = compare(va, vb);
        if (c !== 0) return rule.dir === "asc" ? c : -c;
      }
      return 0;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const filteredIds = sorted.map(getRowId);
  const selectedInView = filteredIds.filter((rid) => selected.has(rid)).length;
  const allState = selectedInView === 0 ? "none" : selectedInView === filteredIds.length ? "all" : "some";

  /** Click: sort by this column only, cycling asc → desc → off. Shift-click: add it as a tie-breaker. */
  const toggleSort = (key: string, additive: boolean) => {
    setPage(0);
    setSort((rules) => {
      const existing = rules.find((r) => r.key === key);
      const nextDir = !existing ? "asc" : existing.dir === "asc" ? "desc" : null;
      if (!additive) return nextDir ? [{ key, dir: nextDir }] : [];
      const rest = rules.filter((r) => r.key !== key);
      if (!nextDir) return rest;
      return existing
        ? rules.map((r) => (r.key === key ? { key, dir: nextDir } : r))
        : [...rest, { key, dir: nextDir }];
    });
  };

  /** Shift-click selects every row between the last clicked row and this one, in the current order. */
  const toggleRow = (rowId: string, e: MouseEvent<HTMLInputElement>) => {
    const next = new Set(selected);
    const turnOn = !selected.has(rowId);
    if (e.shiftKey && anchor.current && anchor.current !== rowId) {
      const a = filteredIds.indexOf(anchor.current);
      const b = filteredIds.indexOf(rowId);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        for (let i = from; i <= to; i++) {
          if (turnOn) next.add(filteredIds[i]);
          else next.delete(filteredIds[i]);
        }
      }
    } else if (turnOn) next.add(rowId);
    else next.delete(rowId);
    anchor.current = rowId;
    setSelected(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    if (allState === "all") filteredIds.forEach((rid) => next.delete(rid));
    else filteredIds.forEach((rid) => next.add(rid));
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());
  const selectedRows = rows.filter((r) => selected.has(getRowId(r)));
  const cellPad = dense ? "px-3 py-1.5" : "px-4 py-3";

  const describeSort =
    sort.length === 0
      ? "Not sorted"
      : "Sorted by " +
        sort
          .map((r) => `${columns.find((c) => c.key === r.key)?.header} ${r.dir === "asc" ? "ascending" : "descending"}`)
          .join(", then ");

  return (
    <div style={{ "--dt-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Search {caption}</span>
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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search…"
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[var(--dt-accent)] focus-visible:outline-none"
          />
        </label>

        <details className="relative">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] [&::-webkit-details-marker]:hidden">
            Columns
            <span className="text-xs text-zinc-500">
              {visibleColumns.length}/{columns.length}
            </span>
          </summary>
          <fieldset className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
            <legend className="sr-only">Visible columns</legend>
            {columns.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 has-disabled:cursor-not-allowed has-disabled:opacity-50"
              >
                <input
                  type="checkbox"
                  checked={!hidden.has(c.key)}
                  disabled={c.hideable === false || (!hidden.has(c.key) && visibleColumns.length === 1)}
                  onChange={() =>
                    setHidden((h) => {
                      const next = new Set(h);
                      if (next.has(c.key)) next.delete(c.key);
                      else next.add(c.key);
                      return next;
                    })
                  }
                  className="size-4 accent-[var(--dt-accent)]"
                />
                {c.header}
              </label>
            ))}
          </fieldset>
        </details>

        <button
          type="button"
          aria-pressed={dense}
          onClick={() => setDense((d) => !d)}
          className="h-9 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] aria-pressed:border-[var(--dt-accent)] aria-pressed:text-zinc-100"
        >
          Compact
        </button>
      </div>

      {/* Bulk action bar */}
      {selectable && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-[color-mix(in_oklab,var(--dt-accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--dt-accent)_10%,transparent)] px-3 py-2 text-sm">
          <span className="font-medium text-zinc-100" aria-live="polite">
            {selected.size} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">{bulkActions?.(selectedRows, clearSelection)}</div>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto rounded text-sm text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)]"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm" aria-describedby={`${id}-sort`}>
          <caption className="sr-only">
            {caption}. Click a column header to sort, Shift-click to add a tie-breaker.
          </caption>
          <thead className="sticky top-0 z-10 bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              {selectable && (
                <th scope="col" className={`${cellPad} w-10`}>
                  <input
                    type="checkbox"
                    aria-label={allState === "all" ? "Deselect all rows" : "Select all rows"}
                    checked={allState === "all"}
                    ref={(el) => {
                      if (el) el.indeterminate = allState === "some";
                    }}
                    onChange={toggleAll}
                    disabled={filteredIds.length === 0}
                    className="size-4 cursor-pointer accent-[var(--dt-accent)]"
                  />
                </th>
              )}
              {visibleColumns.map((c) => {
                const ruleIndex = sort.findIndex((r) => r.key === c.key);
                const rule = sort[ruleIndex];
                const canSort = c.sortable ?? true;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={rule ? (rule.dir === "asc" ? "ascending" : "descending") : canSort ? "none" : undefined}
                    className={[
                      "whitespace-nowrap font-medium",
                      canSort ? "p-0" : cellPad,
                      c.align === "right" ? "text-right" : "",
                    ].join(" ")}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={(e) => toggleSort(c.key, e.shiftKey)}
                        className={[
                          "inline-flex w-full items-center gap-1.5 uppercase tracking-wider hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dt-accent)]",
                          cellPad,
                          c.align === "right" ? "justify-end" : "",
                          rule ? "text-zinc-100" : "",
                        ].join(" ")}
                      >
                        {c.header}
                        <SortIcon dir={rule?.dir} />
                        {sort.length > 1 && rule && (
                          <span className="grid size-4 place-items-center rounded-full bg-[var(--dt-accent)] text-[10px] text-zinc-950">
                            {ruleIndex + 1}
                          </span>
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selected.has(rowId);
                return (
                  <tr
                    key={rowId}
                    className={[
                      "transition-colors",
                      isSelected ? "bg-[color-mix(in_oklab,var(--dt-accent)_10%,transparent)]" : "hover:bg-zinc-900/60",
                    ].join(" ")}
                  >
                    {selectable && (
                      <td className={cellPad}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${rowId}`}
                          checked={isSelected}
                          onClick={(e) => toggleRow(rowId, e)}
                          onChange={() => {}}
                          className="size-4 cursor-pointer accent-[var(--dt-accent)]"
                        />
                      </td>
                    )}
                    {visibleColumns.map((c) => {
                      const raw = c.value(row);
                      return (
                        <td
                          key={c.key}
                          className={[
                            cellPad,
                            "text-zinc-200",
                            c.align === "right" ? "text-right tabular-nums" : "",
                          ].join(" ")}
                        >
                          {c.cell ? c.cell(row) : raw instanceof Date ? raw.toLocaleDateString() : (raw ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <p id={`${id}-sort`} aria-live="polite">
          {sorted.length === rows.length ? `${rows.length} rows` : `${sorted.length} of ${rows.length} rows`}
          <span className="hidden sm:inline"> · {describeSort}</span>
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows</span>
            <span className="sr-only sm:hidden">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-200 focus-visible:border-[var(--dt-accent)] focus-visible:outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="grid size-8 place-items-center rounded-md border border-zinc-700 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <span className="min-w-16 text-center tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="grid size-8 place-items-center rounded-md border border-zinc-700 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
