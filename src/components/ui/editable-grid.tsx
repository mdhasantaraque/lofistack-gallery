"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export type CellValue = string | number | null;
export type GridRow = { id: string } & Record<string, CellValue>;

export interface GridColumn {
  key: string;
  header: string;
  type?: "text" | "number" | "currency" | "select";
  options?: string[];
  /** Return an error message, or null when the value is fine. */
  validate?: (value: CellValue, row: GridRow) => string | null;
  /** Adds a total under number and currency columns. */
  total?: boolean;
  width?: string;
}

export interface EditableGridProps {
  columns: GridColumn[];
  initialRows: GridRow[];
  /** Fires after every committed edit, undo, redo, add or delete. */
  onChange?: (rows: GridRow[]) => void;
  /** Accessible name of the grid. */
  label: string;
  currency?: string;
  locale?: string;
  /** Values for a new row. */
  newRow?: () => Omit<GridRow, "id">;
  accent?: string;
  className?: string;
}

interface Change {
  rowId: string;
  key: string;
  before: CellValue;
  after: CellValue;
}

type Cell = { row: number; col: number };

const parse = (col: GridColumn, raw: string): CellValue => {
  if (col.type === "number" || col.type === "currency") {
    const cleaned = raw.replace(/[^\d.-]/g, "");
    return cleaned === "" ? null : Number(cleaned);
  }
  return raw;
};

export function EditableGrid({
  columns,
  initialRows,
  onChange,
  label,
  currency = "USD",
  locale = "en-US",
  newRow,
  accent = "#38bdf8",
  className = "",
}: EditableGridProps) {
  const id = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLInputElement & HTMLSelectElement>(null);
  // The starting rows, to mark edited cells. Kept in state (never updated) so render can read it.
  const [original] = useState(() => new Map(initialRows.map((r) => [r.id, r])));
  const counter = useRef(initialRows.length);
  // True only while an editor is open. Blur can fire after Enter or Escape already closed it,
  // and must not commit a second time (or commit a cancelled edit).
  const editOpen = useRef(false);
  // Set when an edit closes, so focus goes back to the grid instead of falling to the page body.
  const refocus = useRef(false);
  const [rows, setRows] = useState(initialRows);
  const [active, setActive] = useState<Cell>({ row: 0, col: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<Change[]>([]);
  const [redo, setRedo] = useState<Change[]>([]);
  const [notice, setNotice] = useState("");

  const money = new Intl.NumberFormat(locale, { style: "currency", currency });
  const num = new Intl.NumberFormat(locale);
  const show = (col: GridColumn, v: CellValue) =>
    v === null || v === ""
      ? ""
      : col.type === "currency"
        ? money.format(Number(v))
        : col.type === "number"
          ? num.format(Number(v))
          : String(v);

  // Keep real focus on the active cell, or on the editor while editing.
  useEffect(() => {
    if (editing !== null) {
      editorRef.current?.focus();
      return;
    }
    if (refocus.current || gridRef.current?.contains(document.activeElement)) {
      refocus.current = false;
      gridRef.current?.querySelector<HTMLElement>(`[data-cell="${active.row}-${active.col}"]`)?.focus();
    }
  }, [active, editing]);

  const commitRows = (next: GridRow[]) => {
    setRows(next);
    onChange?.(next);
  };

  const apply = (changes: Change[], direction: "before" | "after", source: GridRow[]) =>
    source.map((r) => {
      const mine = changes.filter((c) => c.rowId === r.id);
      if (!mine.length) return r;
      const copy = { ...r };
      for (const c of mine) copy[c.key] = c[direction];
      return copy;
    });

  const setCell = (rowIndex: number, colIndex: number, value: CellValue): boolean => {
    const col = columns[colIndex];
    const row = rows[rowIndex];
    const message = col.validate?.(value, row) ?? null;
    if (message) {
      setError(message);
      setNotice(`${col.header}: ${message}`);
      return false;
    }
    setError(null);
    if (row[col.key] === value) return true;
    const change: Change = { rowId: row.id, key: col.key, before: row[col.key], after: value };
    commitRows(apply([change], "after", rows));
    setUndo((u) => [...u, change].slice(-100));
    setRedo([]);
    return true;
  };

  const move = (row: number, col: number) =>
    setActive({
      row: Math.max(0, Math.min(rows.length - 1, row)),
      col: Math.max(0, Math.min(columns.length - 1, col)),
    });

  const startEdit = (initial?: string) => {
    const col = columns[active.col];
    const value = rows[active.row]?.[col.key];
    setError(null);
    editOpen.current = true;
    setEditing(initial ?? (value === null ? "" : String(value)));
  };

  const finishEdit = (then?: "down" | "right" | "left") => {
    if (editing === null || !editOpen.current) return;
    const ok = setCell(active.row, active.col, parse(columns[active.col], editing));
    if (!ok) return;
    editOpen.current = false;
    refocus.current = true;
    setEditing(null);
    if (then === "down") move(active.row + 1, active.col);
    if (then === "right") {
      if (active.col < columns.length - 1) move(active.row, active.col + 1);
      else move(active.row + 1, 0);
    }
    if (then === "left") {
      if (active.col > 0) move(active.row, active.col - 1);
      else move(active.row - 1, columns.length - 1);
    }
  };

  const undoLast = () => {
    const change = undo.at(-1);
    if (!change) return;
    commitRows(apply([change], "before", rows));
    setUndo((u) => u.slice(0, -1));
    setRedo((r) => [...r, change]);
    setNotice("Undone");
  };

  const redoLast = () => {
    const change = redo.at(-1);
    if (!change) return;
    commitRows(apply([change], "after", rows));
    setRedo((r) => r.slice(0, -1));
    setUndo((u) => [...u, change]);
    setNotice("Redone");
  };

  const onGridKey = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing !== null) return;
    const mod = e.ctrlKey || e.metaKey;
    const col = columns[active.col];
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redoLast();
      else undoLast();
      return;
    }
    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redoLast();
      return;
    }
    if (mod && e.key.toLowerCase() === "c") {
      e.preventDefault();
      await navigator.clipboard?.writeText(String(rows[active.row]?.[col.key] ?? "")).catch(() => {});
      setNotice("Copied");
      return;
    }
    if (mod && e.key.toLowerCase() === "v") {
      e.preventDefault();
      const text = await navigator.clipboard?.readText().catch(() => null);
      if (text != null && setCell(active.row, active.col, parse(col, text.trim()))) setNotice("Pasted");
      return;
    }
    const moves: Record<string, () => void> = {
      ArrowUp: () => move(active.row - 1, active.col),
      ArrowDown: () => move(active.row + 1, active.col),
      ArrowLeft: () => move(active.row, active.col - 1),
      ArrowRight: () => move(active.row, active.col + 1),
      Home: () => move(mod ? 0 : active.row, 0),
      End: () => move(mod ? rows.length - 1 : active.row, columns.length - 1),
      Tab: () => (e.shiftKey ? move(active.row, active.col - 1) : move(active.row, active.col + 1)),
    };
    if (
      moves[e.key] &&
      !(e.key === "Tab" && ((e.shiftKey && active.col === 0) || (!e.shiftKey && active.col === columns.length - 1)))
    ) {
      e.preventDefault();
      moves[e.key]();
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      startEdit();
    } else if (mod && (e.key === "Delete" || e.key === "Backspace")) {
      // Ctrl/Cmd+Delete removes the whole row, so it works without the mouse.
      e.preventDefault();
      deleteRow(active.row);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      setCell(active.row, active.col, col.type === "text" || col.type === "select" ? "" : null);
    } else if (e.key.length === 1 && !mod && col.type !== "select") {
      // Typing on a cell starts editing with that character, like a spreadsheet.
      e.preventDefault();
      startEdit(e.key);
    }
  };

  const onEditorKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit("down");
    } else if (e.key === "Tab") {
      e.preventDefault();
      finishEdit(e.shiftKey ? "left" : "right");
    } else if (e.key === "Escape") {
      e.preventDefault();
      editOpen.current = false;
      refocus.current = true;
      setEditing(null);
      setError(null);
      setNotice("Edit cancelled");
    }
  };

  const addRow = () => {
    counter.current += 1;
    const blank = Object.fromEntries(
      columns.map((c) => [c.key, c.type === "number" || c.type === "currency" ? null : ""]),
    );
    const row = { ...blank, ...(newRow?.() ?? {}), id: `new-${counter.current}` } as GridRow;
    commitRows([...rows, row]);
    setActive({ row: rows.length, col: 0 });
    window.setTimeout(() => gridRef.current?.querySelector<HTMLElement>(`[data-cell="${rows.length}-0"]`)?.focus(), 0);
    setNotice("Row added");
  };

  const deleteRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    commitRows(next);
    setActive((a) => ({ row: Math.min(a.row, Math.max(next.length - 1, 0)), col: a.col }));
    setNotice("Row deleted");
  };

  const edited = (row: GridRow, key: string) => {
    const orig = original.get(row.id);
    return !orig || orig[key] !== row[key];
  };

  const totals = columns.map((c) =>
    c.total && (c.type === "number" || c.type === "currency")
      ? rows.reduce((sum, r) => sum + (typeof r[c.key] === "number" ? (r[c.key] as number) : 0), 0)
      : null,
  );

  const btn =
    "h-8 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eg-accent)] disabled:opacity-40";

  return (
    <div style={{ "--eg-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className={btn}>
          + Add row
        </button>
        <button type="button" onClick={undoLast} disabled={!undo.length} className={btn} aria-keyshortcuts="Control+Z">
          Undo
        </button>
        <button type="button" onClick={redoLast} disabled={!redo.length} className={btn} aria-keyshortcuts="Control+Y">
          Redo
        </button>
        <p className="ml-auto text-xs text-zinc-500">
          Type or Enter to edit · Tab/Enter to commit · Esc to cancel · Ctrl+Delete removes a row
        </p>
      </div>

      {/* relative: keeps absolutely positioned screen-reader text inside the scroll box, so it can't widen the page. */}
      <div className="relative overflow-x-auto rounded-xl border border-zinc-800">
        <div
          ref={gridRef}
          role="grid"
          aria-label={label}
          aria-rowcount={rows.length + 1}
          onKeyDown={onGridKey}
          className="min-w-[40rem] text-sm"
          style={{
            display: "grid",
            gridTemplateColumns: `${columns.map((c) => c.width ?? "minmax(8rem,1fr)").join(" ")} 3rem`,
          }}
        >
          <div role="row" className="contents">
            {columns.map((c) => (
              <div
                key={c.key}
                role="columnheader"
                className={[
                  "border-b border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-400",
                  c.type === "number" || c.type === "currency" ? "text-right" : "",
                ].join(" ")}
              >
                {c.header}
              </div>
            ))}
            <div role="columnheader" className="border-b border-zinc-800 bg-zinc-900">
              <span className="sr-only">Actions</span>
            </div>
          </div>

          {rows.map((row, ri) => (
            <div role="row" key={row.id} className="contents">
              {columns.map((c, ci) => {
                const isActive = active.row === ri && active.col === ci;
                const isEditing = isActive && editing !== null;
                const numeric = c.type === "number" || c.type === "currency";
                const changed = edited(row, c.key);
                return (
                  <div
                    key={c.key}
                    role="gridcell"
                    data-cell={`${ri}-${ci}`}
                    tabIndex={isActive && !isEditing ? 0 : -1}
                    aria-selected={isActive}
                    aria-invalid={isEditing && error ? true : undefined}
                    onClick={() => setActive({ row: ri, col: ci })}
                    onDoubleClick={() => {
                      setActive({ row: ri, col: ci });
                      editOpen.current = true;
                      setEditing(row[c.key] === null ? "" : String(row[c.key]));
                    }}
                    className={[
                      "relative min-h-10 border-b border-zinc-800/70 px-3 py-2 outline-none",
                      numeric ? "text-right tabular-nums" : "",
                      isActive ? "ring-2 ring-inset ring-[var(--eg-accent)]" : "",
                      isEditing && error ? "ring-red-400" : "",
                      changed ? "bg-[color-mix(in_oklab,var(--eg-accent)_7%,transparent)]" : "",
                      "text-zinc-100",
                    ].join(" ")}
                  >
                    {isEditing ? (
                      c.type === "select" ? (
                        <select
                          ref={editorRef}
                          value={editing ?? ""}
                          aria-label={c.header}
                          onChange={(e) => setEditing(e.target.value)}
                          onKeyDown={onEditorKey}
                          onBlur={() => finishEdit()}
                          className="absolute inset-0 h-full w-full bg-zinc-900 px-2 text-sm text-zinc-100 focus:outline-none"
                        >
                          {c.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          ref={editorRef}
                          value={editing ?? ""}
                          inputMode={numeric ? "decimal" : undefined}
                          aria-label={c.header}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? `${id}-error` : undefined}
                          onChange={(e) => {
                            setEditing(e.target.value);
                            setError(null);
                          }}
                          onKeyDown={onEditorKey}
                          onBlur={() => finishEdit()}
                          className={[
                            "absolute inset-0 h-full w-full bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none",
                            numeric ? "text-right tabular-nums" : "",
                          ].join(" ")}
                        />
                      )
                    ) : (
                      <>
                        {show(c, row[c.key]) || <span className="text-zinc-600">—</span>}
                        {changed && (
                          <span
                            aria-hidden="true"
                            className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--eg-accent)]"
                          />
                        )}
                        {changed && <span className="sr-only"> (edited)</span>}
                      </>
                    )}
                    {isEditing && error && (
                      <span
                        id={`${id}-error`}
                        role="alert"
                        className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-red-950 px-2 py-1 text-xs text-red-200 shadow-lg"
                      >
                        {error}
                      </span>
                    )}
                  </div>
                );
              })}
              <div role="gridcell" className="grid place-items-center border-b border-zinc-800/70">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => deleteRow(ri)}
                  aria-label={`Delete row ${ri + 1}`}
                  className="grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {totals.some((t) => t !== null) && (
            <div role="row" className="contents">
              {columns.map((c, ci) => (
                <div
                  key={c.key}
                  role="gridcell"
                  className={[
                    "bg-zinc-900/60 px-3 py-2.5 font-semibold text-zinc-50",
                    c.type === "number" || c.type === "currency" ? "text-right tabular-nums" : "text-zinc-400",
                  ].join(" ")}
                >
                  {ci === 0 ? "Total" : totals[ci] !== null ? show(c, totals[ci]) : ""}
                </div>
              ))}
              <div role="gridcell" className="bg-zinc-900/60" />
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500" aria-live="polite">
        {rows.length} rows · {undo.length} change{undo.length === 1 ? "" : "s"} to undo{notice ? ` · ${notice}` : ""}
      </p>
    </div>
  );
}

export default EditableGrid;
