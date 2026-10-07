"use client";

import { useState } from "react";
import { PricingCard, type PricingFeature } from "@/components/ui/pricing-card";

type Billing = "monthly" | "yearly";

interface Plan {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: PricingFeature[];
  badge?: string;
  highlighted?: boolean;
  accent?: string;
  ctaLabel: string;
}

const plans: Plan[] = [
  {
    name: "Starter",
    description: "For side projects and trying things out.",
    monthly: 0,
    yearly: 0,
    ctaLabel: "Start free",
    features: [
      { label: "3 projects" },
      { label: "Community support" },
      { label: "Basic analytics" },
      { label: "Custom domains", included: false },
      { label: "Team roles", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For freelancers shipping client work every week.",
    monthly: 24,
    yearly: 19,
    badge: "Most popular",
    highlighted: true,
    accent: "#a78bfa",
    ctaLabel: "Upgrade to Pro",
    features: [
      { label: "Unlimited projects" },
      { label: "Priority email support" },
      { label: "Advanced analytics" },
      { label: "Custom domains" },
      { label: "Team roles", included: false },
    ],
  },
  {
    name: "Team",
    description: "For studios that need shared workspaces.",
    monthly: 79,
    yearly: 63,
    accent: "#34d399",
    ctaLabel: "Contact sales",
    features: [
      { label: "Everything in Pro" },
      { label: "Up to 20 seats" },
      { label: "SSO and audit log" },
      { label: "Custom domains" },
      { label: "Team roles" },
    ],
  },
];

export default function PricingCardDemo() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-10 sm:px-8 sm:py-12">
      <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1"
        >
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={billing === option}
              onClick={() => setBilling(option)}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                billing === option ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100",
              ].join(" ")}
            >
              {option}
              {option === "yearly" && <span className="ml-1.5 text-xs text-emerald-500">-20%</span>}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={loading}
            onChange={(e) => setLoading(e.target.checked)}
            className="size-4 accent-violet-400"
          />
          Show loading state
        </label>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            description={plan.description}
            price={billing === "monthly" ? plan.monthly : plan.yearly}
            originalPrice={billing === "yearly" ? plan.monthly : undefined}
            priceNote={plan.monthly === 0 ? "Free forever" : billing === "yearly" ? "Billed yearly" : "Billed monthly"}
            features={plan.features}
            badge={plan.badge}
            highlighted={plan.highlighted}
            accent={plan.accent}
            ctaLabel={plan.ctaLabel}
            loading={loading}
            delay={i * 120}
          />
        ))}
      </div>
    </div>
  );
}
