"use client";

import { useState } from "react";
import { EditableGrid, type GridColumn, type GridRow } from "@/components/ui/editable-grid";

const columns: GridColumn[] = [
  {
    key: "item",
    header: "Item",
    width: "minmax(10rem,2fr)",
    validate: (v) => (String(v ?? "").trim() ? null : "Item can't be empty"),
  },
  { key: "category", header: "Category", type: "select", options: ["Design", "Development", "Hosting", "Marketing"] },
  {
    key: "hours",
    header: "Hours",
    type: "number",
    total: true,
    width: "6rem",
    validate: (v) => (v === null || (Number(v) >= 0 && Number(v) <= 200) ? null : "Use 0 to 200 hours"),
  },
  {
    key: "amount",
    header: "Amount",
    type: "currency",
    total: true,
    width: "9rem",
    validate: (v) => (v === null || Number(v) >= 0 ? null : "Amount can't be negative"),
  },
];

const initial: GridRow[] = [
  { id: "1", item: "Landing page design", category: "Design", hours: 12, amount: 450 },
  { id: "2", item: "Component builds", category: "Development", hours: 40, amount: 1800 },
  { id: "3", item: "Vercel Pro, 3 months", category: "Hosting", hours: null, amount: 60 },
  { id: "4", item: "Launch ads", category: "Marketing", hours: 4, amount: 300 },
];

export default function EditableGridDemo() {
  const [summary, setSummary] = useState("Click a cell and start typing. Try a negative amount or a blank item.");

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-3 py-6 sm:px-6 sm:py-8">
      <EditableGrid
        label="Project budget"
        columns={columns}
        initialRows={initial}
        newRow={() => ({ item: "New item", category: "Development", hours: null, amount: null })}
        onChange={(rows) => {
          const total = rows.reduce((n, r) => n + (Number(r.amount) || 0), 0);
          setSummary(`onChange: ${rows.length} rows, budget $${total.toLocaleString("en-US")}`);
        }}
      />
      <p className="mt-3 text-sm text-zinc-400" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
