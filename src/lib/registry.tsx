import type { ComponentType } from "react";
import GlassButtonDemo from "@/components/demos/glass-button-demo";
import PricingCardDemo from "@/components/demos/pricing-card-demo";

/** Plain labels from the challenge brief. Used to keep components distinct. */
export type UiType =
  "button" | "form" | "card" | "modal" | "navbar" | "table" | "loader" | "section" | "chart" | "input";

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface GalleryEntry {
  slug: string;
  name: string;
  type: UiType;
  week: number;
  description: string;
  /** Path from the repo root to the component source. */
  sourceFile: string;
  usage: string;
  props: PropDoc[];
  Demo: ComponentType;
}

export const registry: GalleryEntry[] = [
  {
    slug: "glass-button",
    name: "Glass Button",
    type: "button",
    week: 1,
    description:
      "A glassmorphism button with a curved top highlight, a light sweep on hover, any tint color, three sizes, icons and a built-in loading state.",
    sourceFile: "src/components/ui/glass-button.tsx",
    usage: `"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";

export function Example() {
  const [saving, setSaving] = useState(false);

  return (
    <GlassButton
      variant="frosted"
      tint="#a78bfa"
      size="lg"
      loading={saving}
      loadingText="Saving…"
      onClick={() => setSaving(true)}
    >
      Save changes
    </GlassButton>
  );
}`,
    props: [
      {
        name: "variant",
        type: '"clear" | "frosted"',
        default: '"clear"',
        description: "Glass density. Frosted blurs and tints more.",
      },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Height, padding and font size." },
      { name: "tint", type: "string", default: '"#ffffff"', description: "Any CSS color mixed into the glass." },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Shows a spinner, sets aria-busy and disables the button.",
      },
      { name: "loadingText", type: "ReactNode", description: "Label shown while loading." },
      {
        name: "leftIcon / rightIcon",
        type: "ReactNode",
        description: "Icons placed around the label. The spinner replaces the left icon.",
      },
      { name: "fullWidth", type: "boolean", default: "false", description: "Stretches to the container width." },
      {
        name: "...rest",
        type: 'ComponentPropsWithRef<"button">',
        description: "Every native button prop, including ref, onClick and disabled.",
      },
    ],
    Demo: GlassButtonDemo,
  },
  {
    slug: "pricing-card",
    name: "Animated Pricing Card",
    type: "card",
    week: 1,
    description:
      "A pricing plan card with a staggered entrance, a count-up price when billing changes, a spinning gradient border for the featured plan, and a loading skeleton.",
    sourceFile: "src/components/ui/pricing-card.tsx",
    usage: `import { PricingCard } from "@/components/ui/pricing-card";

export function Example({ yearly }: { yearly: boolean }) {
  return (
    <PricingCard
      name="Pro"
      description="For freelancers shipping client work every week."
      price={yearly ? 19 : 24}
      originalPrice={yearly ? 24 : undefined}
      priceNote={yearly ? "Billed yearly" : "Billed monthly"}
      badge="Most popular"
      highlighted
      accent="#a78bfa"
      features={[
        { label: "Unlimited projects" },
        { label: "Custom domains" },
        { label: "Team roles", included: false },
      ]}
      ctaLabel="Upgrade to Pro"
      onCtaClick={() => console.log("checkout")}
    />
  );
}`,
    props: [
      { name: "name", type: "string", description: "Plan name. Also labels the card for screen readers." },
      { name: "description", type: "string", description: "One line under the name." },
      { name: "price", type: "number", description: "Changes animate from the old value to the new one." },
      {
        name: "currency / locale",
        type: "string",
        default: '"USD" / "en-US"',
        description: "Passed to Intl.NumberFormat.",
      },
      { name: "period", type: "string", default: '"/month"', description: "Shown after the price." },
      {
        name: "originalPrice",
        type: "number",
        description: "Struck-through previous price, shown when higher than price.",
      },
      { name: "priceNote", type: "string", description: "Small note under the price." },
      {
        name: "features",
        type: "{ label: ReactNode; included?: boolean }[]",
        description: "Feature list. Excluded items render struck through.",
      },
      { name: "badge", type: "string", description: "Pill in the top right corner." },
      {
        name: "highlighted",
        type: "boolean",
        default: "false",
        description: "Spinning gradient border and a filled CTA.",
      },
      {
        name: "accent",
        type: "string",
        default: '"#818cf8"',
        description: "Any CSS color for border, glow, checks and CTA.",
      },
      {
        name: "ctaLabel / ctaHref / onCtaClick",
        type: "string / string / () => void",
        description: "Button, or a link when ctaHref is set.",
      },
      { name: "ctaDisabled", type: "boolean", default: "false", description: "Disables the CTA." },
      { name: "loading", type: "boolean", default: "false", description: "Shows a skeleton and sets aria-busy." },
      {
        name: "delay",
        type: "number",
        default: "0",
        description: "Entrance delay in ms for staggering a row of cards.",
      },
    ],
    Demo: PricingCardDemo,
  },
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
