"use client";

import { useState } from "react";
import { ComparisonTable, type ComparisonGroup, type ComparisonPlan } from "@/components/ui/comparison-table";

const groups: ComparisonGroup[] = [
  {
    id: "core",
    label: "Core",
    features: [
      { id: "projects", label: "Projects", values: { starter: "3", pro: "Unlimited", team: "Unlimited" } },
      { id: "storage", label: "Storage", values: { starter: "1 GB", pro: "50 GB", team: "1 TB" } },
      {
        id: "domains",
        label: "Custom domains",
        hint: "Point your own domain, like app.yourcompany.com, at any project.",
        values: { starter: false, pro: true, team: true },
      },
      { id: "ssl", label: "Automatic HTTPS", values: { starter: true, pro: true, team: true } },
      { id: "previews", label: "Preview deployments", values: { starter: true, pro: true, team: true } },
    ],
  },
  {
    id: "collab",
    label: "Collaboration",
    features: [
      { id: "seats", label: "Team seats", values: { starter: "1", pro: "3", team: "Up to 50" } },
      {
        id: "comments",
        label: "Comments on previews",
        hint: "Teammates and clients can leave comments right on a preview link.",
        values: { starter: false, pro: "partial", team: true },
      },
      { id: "roles", label: "Roles and permissions", values: { starter: false, pro: false, team: true } },
    ],
  },
  {
    id: "security",
    label: "Security & support",
    features: [
      {
        id: "sso",
        label: "SAML single sign-on",
        hint: "Sign in through Okta, Google Workspace or Azure AD.",
        values: { starter: false, pro: false, team: true },
      },
      { id: "audit", label: "Audit log", values: { starter: false, pro: "30 days", team: "1 year" } },
      { id: "backups", label: "Daily backups", values: { starter: true, pro: true, team: true } },
      { id: "support", label: "Support", values: { starter: "Community", pro: "Email, 1 day", team: "Chat, 1 hour" } },
    ],
  },
];

export default function ComparisonTableDemo() {
  const [picked, setPicked] = useState<string | null>(null);

  const plans: ComparisonPlan[] = [
    {
      id: "starter",
      name: "Starter",
      price: "$0",
      note: "forever",
      cta: { label: "Start free", onClick: () => setPicked("Starter") },
    },
    {
      id: "pro",
      name: "Pro",
      price: "$24",
      note: "per month",
      badge: "Most popular",
      highlighted: true,
      cta: { label: "Upgrade", onClick: () => setPicked("Pro") },
    },
    {
      id: "team",
      name: "Team",
      price: "$79",
      note: "per month",
      cta: { label: "Contact sales", onClick: () => setPicked("Team") },
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-3 py-6 sm:px-6 sm:py-8">
      <ComparisonTable caption="Compare plans" plans={plans} groups={groups} maxHeight="34rem" />
      <p className="mt-2 text-sm text-zinc-400" aria-live="polite">
        {picked ? `CTA clicked: ${picked}` : "Hover the ? icons, collapse a group, or turn on Only show differences."}
      </p>
    </div>
  );
}
