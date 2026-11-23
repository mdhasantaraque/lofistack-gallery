"use client";

import { useState } from "react";
import { FeatureTabs, type Feature } from "@/components/ui/feature-tabs";

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Small CSS-only mock screens, so the demo needs no images. */
function DashboardMock() {
  const bars = [40, 65, 52, 80, 58, 92, 74];
  return (
    <div className="grid aspect-[16/9] grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
      {["Revenue", "Active users", "Churn"].map((k, i) => (
        <div key={k} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
          <p className="truncate text-[10px] text-zinc-500">{k}</p>
          <p className="text-sm font-semibold text-zinc-100 sm:text-base">{["$48.2k", "3,910", "1.8%"][i]}</p>
        </div>
      ))}
      <div className="col-span-3 flex items-end gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2 sm:gap-2">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-t bg-violet-400/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function AlertsMock() {
  const rows = [
    { t: "Checkout errors above 2%", c: "bg-rose-400", s: "Now" },
    { t: "Sign-ups up 34% vs last week", c: "bg-emerald-400", s: "12m" },
    { t: "API latency back to normal", c: "bg-sky-400", s: "1h" },
  ];
  return (
    <ul className="flex aspect-[16/9] flex-col justify-center gap-2 p-3 sm:p-4">
      {rows.map((r) => (
        <li key={r.t} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className={`size-2 shrink-0 rounded-full ${r.c}`} />
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-200 sm:text-sm">{r.t}</span>
          <span className="text-[10px] text-zinc-500">{r.s}</span>
        </li>
      ))}
    </ul>
  );
}

function TeamMock() {
  return (
    <div className="flex aspect-[16/9] flex-col justify-center gap-3 p-3 sm:p-4">
      {[
        { n: "AR", c: "#f472b6", m: "Can we split this by region?" },
        { n: "TA", c: "#38bdf8", m: "Done, added a filter on the chart." },
        { n: "NI", c: "#34d399", m: "Perfect, sharing with the board 🎉" },
      ].map((x, i) => (
        <div key={x.n} className={`flex items-start gap-2 ${i === 1 ? "flex-row-reverse" : ""}`}>
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-zinc-950"
            style={{ background: x.c }}
          >
            {x.n}
          </span>
          <p className="max-w-[75%] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200">
            {x.m}
          </p>
        </div>
      ))}
    </div>
  );
}

function IntegrationsMock() {
  const apps = ["Stripe", "Slack", "Postgres", "HubSpot", "Sheets", "Segment", "Shopify", "BigQuery"];
  return (
    <div className="grid aspect-[16/9] grid-cols-4 content-center gap-2 p-3 sm:gap-3 sm:p-4">
      {apps.map((a, i) => (
        <div
          key={a}
          className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${i < 3 ? "border-violet-400/40 bg-violet-400/10" : "border-zinc-800 bg-zinc-900"}`}
        >
          <span className="grid size-6 place-items-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300">
            {a[0]}
          </span>
          <span className="w-full truncate text-center text-[10px] text-zinc-400">{a}</span>
        </div>
      ))}
    </div>
  );
}

const features: Feature[] = [
  {
    id: "dashboards",
    label: "Dashboards",
    summary: "Live numbers in one place",
    icon: icon("M3 17V9m5 8V4m5 13v-6m4 6V7"),
    title: "Dashboards that build themselves",
    description:
      "Connect a source and get a ready-made dashboard in seconds. Drag cards around, pick a time range, done.",
    points: ["40+ chart types", "Shareable public links", "Auto-refresh every minute", "Dark and light themes"],
    media: <DashboardMock />,
    cta: { label: "See dashboard templates", href: "#dashboards" },
  },
  {
    id: "alerts",
    label: "Smart alerts",
    summary: "Know before customers do",
    icon: icon("M10 3a5 5 0 0 0-5 5v3l-1.5 3h13L15 11V8a5 5 0 0 0-5-5Zm-2 13a2 2 0 0 0 4 0"),
    title: "Alerts that only ping when it matters",
    description: "Set a threshold or let anomaly detection learn what normal looks like for each metric.",
    points: ["Slack, email and SMS", "Quiet hours", "Anomaly detection", "One-click snooze"],
    media: <AlertsMock />,
  },
  {
    id: "collaboration",
    label: "Collaboration",
    summary: "Comment right on the data",
    icon: icon("M4 5h12v8H8l-4 3V5Z"),
    title: "Talk about the numbers where they live",
    description: "Comment on any chart, mention a teammate and resolve threads when the question is answered.",
    points: ["@mentions", "Threaded comments", "Roles and permissions", "Activity history"],
    media: <TeamMock />,
  },
  {
    id: "integrations",
    label: "Integrations",
    summary: "Plug in the tools you use",
    icon: icon("M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0V7Zm5 8v2"),
    title: "Connect everything in a few clicks",
    description: "Pull data from payments, CRM, databases and spreadsheets without writing a pipeline.",
    points: ["60+ connectors", "Hourly syncs", "Read-only access", "Custom webhooks"],
    media: <IntegrationsMock />,
    cta: { label: "Browse all integrations", href: "#integrations" },
  },
];

export default function FeatureTabsDemo() {
  const [seen, setSeen] = useState("dashboards");
  return (
    <div className="w-full max-w-4xl space-y-3">
      <FeatureTabs
        eyebrow="Why Lumen"
        title="Everything your team needs to read the numbers"
        description="One workspace for dashboards, alerts and the conversations around them."
        features={features}
        interval={5000}
        onChange={setSeen}
      />
      <p className="text-xs text-zinc-500">
        Showing: <span className="text-zinc-300">{seen}</span>. Rotation pauses while you hover, while a tab has
        keyboard focus and when the section is off-screen. Picking a tab stops it.
      </p>
    </div>
  );
}
