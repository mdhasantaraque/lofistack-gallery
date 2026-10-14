"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type Status = "Paid" | "Pending" | "Refunded" | "Failed";

interface Order {
  id: string;
  customer: string;
  email: string;
  status: Status;
  amount: number;
  date: string;
  country: string;
}

// Deterministic sample data so the server and browser render the same rows.
function sampleOrders(count: number): Order[] {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const first = [
    "Ayesha",
    "Rafi",
    "Mina",
    "Tanvir",
    "Sara",
    "Imran",
    "Nadia",
    "Karim",
    "Lena",
    "Omar",
    "Priya",
    "Jonas",
  ];
  const last = ["Rahman", "Khan", "Chowdhury", "Ahmed", "Islam", "Haque", "Novak", "Silva", "Mehta", "Berg"];
  const countries = ["Bangladesh", "India", "Germany", "Brazil", "Sweden", "UAE", "Canada"];
  const statuses: Status[] = ["Paid", "Paid", "Paid", "Pending", "Pending", "Refunded", "Failed"];
  return Array.from({ length: count }, (_, i) => {
    const f = first[Math.floor(rand() * first.length)];
    const l = last[Math.floor(rand() * last.length)];
    const day = 1 + Math.floor(rand() * 28);
    const month = 7 + Math.floor(rand() * 3);
    return {
      id: `#${1040 + i}`,
      customer: `${f} ${l}`,
      email: `${f}.${l}`.toLowerCase() + "@example.com",
      status: statuses[Math.floor(rand() * statuses.length)],
      amount: Math.round((15 + rand() * 480) * 100) / 100,
      date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      country: countries[Math.floor(rand() * countries.length)],
    };
  });
}

const statusStyle: Record<Status, string> = {
  Paid: "bg-emerald-500/15 text-emerald-300",
  Pending: "bg-amber-500/15 text-amber-300",
  Refunded: "bg-sky-500/15 text-sky-300",
  Failed: "bg-red-500/15 text-red-300",
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const columns: DataTableColumn<Order>[] = [
  {
    key: "id",
    header: "Order",
    value: (o) => o.id,
    hideable: false,
    cell: (o) => <span className="font-mono text-zinc-400">{o.id}</span>,
  },
  {
    key: "customer",
    header: "Customer",
    value: (o) => o.customer,
    cell: (o) => (
      <div className="min-w-0">
        <p className="font-medium text-zinc-100">{o.customer}</p>
        <p className="truncate text-xs text-zinc-500">{o.email}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    value: (o) => o.status,
    cell: (o) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[o.status]}`}>{o.status}</span>
    ),
  },
  { key: "country", header: "Country", value: (o) => o.country },
  {
    key: "date",
    header: "Date",
    value: (o) => new Date(`${o.date}T00:00:00Z`),
    searchable: false,
    cell: (o) => <span className="whitespace-nowrap">{shortDate.format(new Date(`${o.date}T00:00:00Z`))}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    value: (o) => o.amount,
    align: "right",
    searchable: false,
    cell: (o) => usd.format(o.amount),
  },
];

const initialOrders = sampleOrders(37);

export default function DataTableDemo() {
  const [orders, setOrders] = useState(initialOrders);
  const [note, setNote] = useState(
    "Try Shift-click on a second column header, or Shift-click two checkboxes to select a range.",
  );

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-3 py-6 sm:px-6 sm:py-8">
      <DataTable
        rows={orders}
        columns={columns}
        getRowId={(o) => o.id}
        caption="Recent orders"
        pageSizeOptions={[8, 16, 40]}
        bulkActions={(selected, clear) => (
          <>
            <button
              type="button"
              onClick={() => {
                const ids = new Set(selected.map((o) => o.id));
                setOrders((all) => all.map((o) => (ids.has(o.id) ? { ...o, status: "Paid" } : o)));
                setNote(`Marked ${selected.length} order${selected.length === 1 ? "" : "s"} as paid.`);
                clear();
              }}
              className="h-7 rounded-md bg-zinc-100 px-2.5 text-xs font-medium text-zinc-950 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Mark as paid
            </button>
            <button
              type="button"
              onClick={() => {
                const ids = new Set(selected.map((o) => o.id));
                setOrders((all) => all.filter((o) => !ids.has(o.id)));
                setNote(`Deleted ${selected.length} order${selected.length === 1 ? "" : "s"}.`);
                clear();
              }}
              className="h-7 rounded-md border border-red-500/40 px-2.5 text-xs font-medium text-red-300 hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Delete
            </button>
          </>
        )}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <p aria-live="polite">{note}</p>
        {orders !== initialOrders && (
          <button
            type="button"
            onClick={() => {
              setOrders(initialOrders);
              setNote("Sample data restored.");
            }}
            className="rounded text-zinc-400 underline underline-offset-2 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            Reset demo data
          </button>
        )}
      </div>
    </div>
  );
}
