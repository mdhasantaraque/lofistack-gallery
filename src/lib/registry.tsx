import type { ComponentType } from "react";
import GlassButtonDemo from "@/components/demos/glass-button-demo";
import PricingCardDemo from "@/components/demos/pricing-card-demo";
import RangeSliderDemo from "@/components/demos/range-slider-demo";
import ConfirmDialogDemo from "@/components/demos/confirm-dialog-demo";
import ActivityHeatmapDemo from "@/components/demos/activity-heatmap-demo";

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
  {
    slug: "range-slider",
    name: "Histogram Range Slider",
    type: "input",
    week: 2,
    description:
      "A two-handle range slider with a live histogram of your data above the track, so people see how many results each move keeps before they let go.",
    sourceFile: "src/components/ui/range-slider.tsx",
    usage: `"use client";

import { useState } from "react";
import { RangeSlider, type RangeValue } from "@/components/ui/range-slider";

export function PriceFilter({ prices }: { prices: number[] }) {
  const [range, setRange] = useState<RangeValue>([200, 900]);

  return (
    <RangeSlider
      label="Price"
      min={0}
      max={2000}
      step={10}
      minDistance={50}
      value={range}
      onChange={setRange}
      onChangeEnd={(r) => fetchResults(r)}
      data={prices}
      formatValue={(n) => \`$\${n}\`}
    />
  );
}`,
    props: [
      { name: "label", type: "string", description: "Visible label and accessible name of both handles." },
      { name: "min / max / step", type: "number", default: "- / - / 1", description: "Bounds and snapping step." },
      { name: "value / defaultValue", type: "[number, number]", description: "Controlled or uncontrolled range." },
      { name: "onChange", type: "(value) => void", description: "Fires on every move." },
      {
        name: "onChangeEnd",
        type: "(value) => void",
        description: "Fires once when a drag or key press ends. Use it to fetch.",
      },
      {
        name: "data",
        type: "number[]",
        description: "Raw values drawn as a histogram, plus an in-range count.",
      },
      { name: "bins", type: "number", default: "24", description: "Number of histogram bars." },
      { name: "minDistance", type: "number", default: "0", description: "Smallest gap between the handles." },
      { name: "formatValue", type: "(n) => string", description: "Formats the label, readout and aria-valuetext." },
      {
        name: "accent",
        type: "string",
        default: '"#38bdf8"',
        description: "Any CSS color for range, bars and handles.",
      },
      { name: "showInputs", type: "boolean", default: "true", description: "Number fields for exact values." },
      { name: "disabled", type: "boolean", default: "false", description: "Blocks pointer and keyboard input." },
    ],
    Demo: RangeSliderDemo,
  },
  {
    slug: "confirm-dialog",
    name: "Destructive Confirm Dialog",
    type: "modal",
    week: 2,
    description:
      "A confirm modal for actions you can't undo: type-the-name or press-and-hold guards, a consequences list, and async confirm with loading and error states. Built on the native dialog element.",
    sourceFile: "src/components/ui/confirm-dialog.tsx",
    usage: `"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProject({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Delete project</button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={\`Delete \${name}?\`}
        description="This can't be undone."
        consequences={["All deployments", "All preview URLs"]}
        guard={{ kind: "type", phrase: name }}
        confirmLabel="Delete project"
        onConfirm={() => api.deleteProject(name)} // a rejected promise shows the error
      />
    </>
  );
}`,
    props: [
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlled open state." },
      { name: "title", type: "string", description: "Dialog heading, also its accessible name." },
      { name: "description", type: "ReactNode", description: "Body text, linked with aria-describedby." },
      { name: "consequences", type: "string[]", description: "What will happen, shown in a tinted callout." },
      {
        name: "guard",
        type: '{ kind: "none" } | { kind: "type"; phrase } | { kind: "hold"; duration? }',
        default: '{ kind: "none" }',
        description: "Type the phrase, or press and hold (mouse, touch, Space or Enter).",
      },
      { name: "tone", type: '"danger" | "neutral"', default: '"danger"', description: "Red or violet accent." },
      {
        name: "confirmLabel / cancelLabel",
        type: "string",
        default: '"Delete" / "Cancel"',
        description: "Button text.",
      },
      {
        name: "onConfirm",
        type: "() => void | Promise<void>",
        description: "Shows a spinner while pending, closes on success, shows the error message on failure.",
      },
    ],
    Demo: ConfirmDialogDemo,
  },
  {
    slug: "activity-heatmap",
    name: "Activity Heatmap",
    type: "chart",
    week: 2,
    description:
      "A calendar heatmap of daily activity with streak stats, quartile color levels, tooltips, arrow-key navigation and time-zone-safe dates.",
    sourceFile: "src/components/ui/activity-heatmap.tsx",
    usage: `import { ActivityHeatmap } from "@/components/ui/activity-heatmap";

export function Contributions({ days }: { days: { date: string; count: number }[] }) {
  return (
    <ActivityHeatmap
      label="Commits in the last year"
      data={days}            // [{ date: "2026-10-13", count: 4 }, ...]
      endDate="2026-10-13"
      weekStart={1}
      accent="#34d399"
      unit={["commit", "commits"]}
      onSelectDay={(day) => console.log(day)}
    />
  );
}`,
    props: [
      {
        name: "data",
        type: "{ date: string; count: number }[]",
        description: "Daily counts. Duplicate dates are summed.",
      },
      { name: "label", type: "string", description: "Accessible name of the grid." },
      {
        name: "endDate",
        type: "string",
        description: "Last day shown (YYYY-MM-DD). Defaults to the latest date in data.",
      },
      { name: "weeks", type: "number", default: "52", description: "Number of week columns." },
      { name: "weekStart", type: "0 | 1", default: "0", description: "Sunday or Monday first." },
      {
        name: "accent",
        type: "string",
        default: '"#34d399"',
        description: "Any CSS color; four levels are mixed from it.",
      },
      {
        name: "unit",
        type: "[string, string]",
        default: '["contribution", "contributions"]',
        description: "Singular and plural unit.",
      },
      { name: "locale", type: "string", default: '"en-US"', description: "Month, weekday and number formatting." },
      { name: "onSelectDay", type: "(day) => void", description: "Click, Enter or Space on a day." },
      { name: "showStats", type: "boolean", default: "true", description: "Total, active days and streaks." },
    ],
    Demo: ActivityHeatmapDemo,
  },
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
