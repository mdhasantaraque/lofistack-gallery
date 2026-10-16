import type { ComponentType } from "react";
import GlassButtonDemo from "@/components/demos/glass-button-demo";
import PricingCardDemo from "@/components/demos/pricing-card-demo";
import RangeSliderDemo from "@/components/demos/range-slider-demo";
import ConfirmDialogDemo from "@/components/demos/confirm-dialog-demo";
import ActivityHeatmapDemo from "@/components/demos/activity-heatmap-demo";
import FormWizardDemo from "@/components/demos/form-wizard-demo";
import DataTableDemo from "@/components/demos/data-table-demo";
import ProgressLoaderDemo from "@/components/demos/progress-loader-demo";
import ScrollspyNavbarDemo from "@/components/demos/scrollspy-navbar-demo";
import FaqSectionDemo from "@/components/demos/faq-section-demo";
import MentionComposerDemo from "@/components/demos/mention-composer-demo";
import SplitButtonDemo from "@/components/demos/split-button-demo";
import ProductCardDemo from "@/components/demos/product-card-demo";
import DonutChartDemo from "@/components/demos/donut-chart-demo";

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
  {
    slug: "form-wizard",
    name: "Multi-Step Form Wizard",
    type: "form",
    week: 3,
    description:
      "A multi-step form driven by a steps config: per-step validation, an error summary that links to each field, a password strength meter, a review step with Edit links, and async submit.",
    sourceFile: "src/components/ui/form-wizard.tsx",
    usage: `import { FormWizard, type WizardStep } from "@/components/ui/form-wizard";

const steps: WizardStep[] = [
  {
    id: "account",
    title: "Account",
    fields: [
      { name: "email", label: "Work email", type: "email", required: true },
      { name: "password", label: "Password", type: "password", required: true, minLength: 8 },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    fields: [
      {
        name: "slug",
        label: "Workspace URL",
        required: true,
        validate: (v) => (/^[a-z0-9-]+$/.test(v) ? null : "Use lowercase letters, numbers and hyphens"),
      },
    ],
  },
];

export function Signup() {
  return <FormWizard steps={steps} onSubmit={(values) => api.signup(values)} submitLabel="Create workspace" />;
}`,
    props: [
      {
        name: "steps",
        type: "WizardStep[]",
        description: "Each step has an id, title, optional description and a list of fields.",
      },
      {
        name: "WizardField",
        type: "{ name, label, type?, required?, minLength?, options?, hint?, validate? }",
        description: "type is text, email, tel, password, textarea or select. validate gets the value and all values.",
      },
      {
        name: "onSubmit",
        type: "(values) => void | Promise<void>",
        description: "A rejected promise shows its message and keeps every answer.",
      },
      { name: "initialValues", type: "Record<string, string>", default: "{}", description: "Prefilled answers." },
      { name: "showReview", type: "boolean", default: "true", description: "Adds a Check your answers step." },
      { name: "submitLabel", type: "string", default: '"Submit"', description: "Text on the final button." },
      {
        name: "successTitle / successMessage",
        type: "string",
        description: "Shown after a successful submit.",
      },
      { name: "accent", type: "string", default: '"#818cf8"', description: "Any CSS color for stepper and buttons." },
    ],
    Demo: FormWizardDemo,
  },
  {
    slug: "data-table",
    name: "Smart Data Table",
    type: "table",
    week: 3,
    description:
      "A typed data table with search, multi-column sort, Shift-click range selection, a bulk action bar, column visibility, compact mode and pagination.",
    sourceFile: "src/components/ui/data-table.tsx",
    usage: `"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

const columns: DataTableColumn<Order>[] = [
  { key: "id", header: "Order", value: (o) => o.id, hideable: false },
  { key: "customer", header: "Customer", value: (o) => o.customer },
  { key: "date", header: "Date", value: (o) => new Date(o.date), searchable: false },
  { key: "amount", header: "Amount", value: (o) => o.amount, align: "right", cell: (o) => usd(o.amount) },
];

export function Orders({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      rows={orders}
      columns={columns}
      getRowId={(o) => o.id}
      caption="Recent orders"
      bulkActions={(selected, clear) => (
        <button onClick={() => { refund(selected); clear(); }}>Refund {selected.length}</button>
      )}
    />
  );
}`,
    props: [
      { name: "rows", type: "T[]", description: "Any row type. The table is generic." },
      {
        name: "columns",
        type: "DataTableColumn<T>[]",
        description:
          "key, header, value (used to sort and search), optional cell renderer, align, sortable, hideable, searchable.",
      },
      { name: "getRowId", type: "(row: T) => string", description: "Stable id used for selection." },
      { name: "caption", type: "string", description: "Accessible name of the table and search box." },
      { name: "pageSizeOptions", type: "number[]", default: "[5, 10, 25]", description: "First one is the default." },
      { name: "selectable", type: "boolean", default: "true", description: "Checkbox column and select-all." },
      {
        name: "bulkActions",
        type: "(selected: T[], clear: () => void) => ReactNode",
        description: "Rendered in the bar that appears when rows are selected.",
      },
      { name: "emptyMessage", type: "string", description: "Shown when the search finds nothing." },
      { name: "accent", type: "string", default: '"#818cf8"', description: "Any CSS color." },
    ],
    Demo: DataTableDemo,
  },
  {
    slug: "progress-loader",
    name: "Stepped Progress Loader",
    type: "loader",
    week: 3,
    description:
      "A loader for long multi-stage jobs: one bar segment per stage, measured and unmeasured stages, a time-left estimate that ignores pauses, and pause, resume, cancel and retry.",
    sourceFile: "src/components/ui/progress-loader.tsx",
    usage: `import { ProgressLoader } from "@/components/ui/progress-loader";

const stages = [
  { id: "upload", label: "Uploading files" },
  { id: "build", label: "Building" },
  { id: "live", label: "Going live" },
];

export function Deploy({ job }: { job: DeployJob }) {
  return (
    <ProgressLoader
      key={job.runId}               // new key = fresh time-left estimate
      title="Deploying my-site"
      stages={stages}
      current={job.stageIndex}
      progress={job.measurable ? job.stageProgress : null}  // null = moving bar
      status={job.status}           // "idle" | "running" | "paused" | "error" | "done"
      errorMessage={job.error}
      onPause={job.pause}
      onResume={job.resume}
      onCancel={job.cancel}
      onRetry={job.retry}
    />
  );
}`,
    props: [
      { name: "title", type: "string", description: "Job name, also labels the progress bar." },
      { name: "stages", type: "{ id; label; detail? }[]", description: "One bar segment and one list row each." },
      { name: "current", type: "number", description: "Index of the stage in progress." },
      {
        name: "progress",
        type: "number | null",
        description: "0 to 1 within the current stage, or null when it can't be measured.",
      },
      {
        name: "status",
        type: '"idle" | "running" | "paused" | "error" | "done"',
        description: "Drives icons, colors, buttons and the spoken status.",
      },
      { name: "errorMessage", type: "string", description: "Shown in an alert when status is error." },
      {
        name: "showEta",
        type: "boolean",
        default: "true",
        description: "Time left, from progress per second of running time.",
      },
      {
        name: "onPause / onResume / onCancel / onRetry",
        type: "() => void",
        description: "Each button only appears when its handler is passed.",
      },
      { name: "accent", type: "string", default: '"#38bdf8"', description: "Any CSS color. Turns red on error." },
    ],
    Demo: ProgressLoaderDemo,
  },
  {
    slug: "scrollspy-navbar",
    name: "Scrollspy Navbar",
    type: "navbar",
    week: 4,
    description:
      "A sticky navbar that hides while you read down and returns on scroll up, condenses after the top, underlines the section in view, and folds into an accessible mobile menu.",
    sourceFile: "src/components/ui/scrollspy-navbar.tsx",
    usage: `"use client";

import { ScrollspyNavbar } from "@/components/ui/scrollspy-navbar";

// Each id must match a section element on the page.
const sections = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <ScrollspyNavbar
      brand={<span>Orbit</span>}
      sections={sections}
      actions={<a href="/signup">Get started</a>}
      // scrollContainer={ref}  // for a scrolling div instead of the window
    />
  );
}`,
    props: [
      { name: "brand", type: "ReactNode", description: "Logo or name on the left." },
      {
        name: "sections",
        type: "{ id: string; label: string }[]",
        description: "Links, each pointing at a section id.",
      },
      { name: "actions", type: "ReactNode", description: "Right-hand slot. Moves into the mobile menu on phones." },
      {
        name: "scrollContainer",
        type: "RefObject<HTMLElement>",
        default: "window",
        description: "Watch a scrolling element instead of the window.",
      },
      {
        name: "hideOnScroll",
        type: "boolean",
        default: "true",
        description: "Slide away on scroll down, back on scroll up.",
      },
      {
        name: "condenseAt",
        type: "number",
        default: "24",
        description: "Pixels scrolled before the bar condenses and blurs.",
      },
      {
        name: "onActiveChange",
        type: "(id: string) => void",
        description: "Fires when the highlighted section changes.",
      },
      {
        name: "accent",
        type: "string",
        default: '"#a78bfa"',
        description: "Any CSS color for the underline and focus rings.",
      },
    ],
    Demo: ScrollspyNavbarDemo,
  },
  {
    slug: "faq-section",
    name: "Searchable FAQ Section",
    type: "section",
    week: 4,
    description:
      "An FAQ section with search that highlights matches, topic filters with counts, an animated accordion, links straight to any answer, and a was-this-helpful prompt.",
    sourceFile: "src/components/ui/faq-section.tsx",
    usage: `import { FaqSection } from "@/components/ui/faq-section";

const items = [
  {
    id: "free-plan",
    category: "Billing",
    question: "Is there a free plan?",
    answer: "Yes. Starter is free forever.\\n\\nYou only need a card to upgrade.",
    keywords: "cost price trial",
  },
  // ...
];

export function Faq() {
  return (
    <FaqSection
      items={items}
      defaultOpen={["free-plan"]}
      onFeedback={(id, helpful) => track("faq_feedback", { id, helpful })}
      emptyState={<a href="mailto:support@example.com">Email support</a>}
    />
  );
}`,
    props: [
      {
        name: "items",
        type: "{ id; question; answer; category?; keywords? }[]",
        description: "answer is plain text; blank lines make paragraphs. keywords are searched but not shown.",
      },
      { name: "title / description", type: "string", description: "Section heading and intro." },
      {
        name: "allowMultiple",
        type: "boolean",
        default: "true",
        description: "When false, opening one closes the rest.",
      },
      { name: "defaultOpen", type: "string[]", default: "[]", description: "Ids open on first render." },
      {
        name: "deepLink",
        type: "boolean",
        default: "true",
        description: "Keeps #faq-{id} in the URL and opens that answer on load. Adds Copy link.",
      },
      { name: "onFeedback", type: "(id, helpful) => void", description: "Shows Was this helpful? under each answer." },
      { name: "emptyState", type: "ReactNode", description: "Shown when nothing matches, e.g. a contact link." },
      { name: "accent", type: "string", default: '"#a78bfa"', description: "Any CSS color." },
    ],
    Demo: FaqSectionDemo,
  },
  {
    slug: "mention-composer",
    name: "Mention Composer",
    type: "input",
    week: 4,
    description:
      "A comment box with @mention suggestions, mentions highlighted inside the text, a who-gets-notified line, a character-limit ring and Ctrl+Enter to send.",
    sourceFile: "src/components/ui/mention-composer.tsx",
    usage: `"use client";

import { MentionComposer, type MentionUser } from "@/components/ui/mention-composer";

export function CommentBox({ team }: { team: MentionUser[] }) {
  return (
    <MentionComposer
      users={team}            // [{ id, name, handle, role?, color? }]
      label="Add a comment"
      maxLength={280}
      onSubmit={async ({ text, mentions }) => {
        await api.comments.create({ text, notify: mentions.map((m) => m.id) });
      }}
    />
  );
}`,
    props: [
      { name: "users", type: "{ id; name; handle; role?; color? }[]", description: "People who can be mentioned." },
      { name: "label", type: "string", description: "Visible label of the text box." },
      {
        name: "onSubmit",
        type: "({ text, mentions }) => void | Promise<void>",
        description: "Clears on success, shows the error on failure.",
      },
      {
        name: "maxLength",
        type: "number",
        default: "280",
        description: "Ring fills up, turns amber at 90% and red over the limit.",
      },
      { name: "placeholder", type: "string", description: "Hint inside the empty box." },
      { name: "submitLabel", type: "string", default: '"Comment"', description: "Button text." },
      { name: "maxSuggestions", type: "number", default: "6", description: "Rows in the suggestion list." },
      {
        name: "accent",
        type: "string",
        default: '"#a78bfa"',
        description: "Any CSS color for pills, ring and button.",
      },
    ],
    Demo: MentionComposerDemo,
  },
  {
    slug: "split-button",
    name: "Split Button",
    type: "button",
    week: 5,
    description:
      "A main action joined to a menu of related ones, with full menu keyboard support, typeahead, disabled and danger items, and a choice mode that remembers which action the button runs.",
    sourceFile: "src/components/ui/split-button.tsx",
    usage: `"use client";

import { SplitButton } from "@/components/ui/split-button";

export function MergeButton({ pr }: { pr: PullRequest }) {
  return (
    <SplitButton
      mode="choice"              // menu picks what the button does
      defaultActionId="squash"
      menuLabel="Select merge method"
      actions={[
        { id: "merge", label: "Create a merge commit", onSelect: () => pr.merge("merge") },
        { id: "squash", label: "Squash and merge", onSelect: () => pr.merge("squash") },
        { id: "rebase", label: "Rebase and merge", onSelect: () => pr.merge("rebase") },
      ]}
    />
  );
}`,
    props: [
      {
        name: "actions",
        type: "{ id; label; onSelect; description?; icon?; shortcut?; disabled?; danger? }[]",
        description: "In menu mode the first one is the main button.",
      },
      {
        name: "mode",
        type: '"menu" | "choice"',
        default: '"menu"',
        description: "choice: picking from the menu changes what the button runs, with a check on the current one.",
      },
      { name: "defaultActionId", type: "string", description: "Starting choice in choice mode." },
      {
        name: "menuLabel",
        type: "string",
        default: '"More options"',
        description: "Accessible name of the arrow button.",
      },
      { name: "size", type: '"sm" | "md"', default: '"md"', description: "Height and menu width." },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Spinner on the main button, both halves blocked.",
      },
      { name: "disabled", type: "boolean", default: "false", description: "Disables both halves." },
      {
        name: "align",
        type: '"start" | "end"',
        default: '"end"',
        description: "Menu edge. It also flips upwards when there's no room below.",
      },
      { name: "accent", type: "string", default: '"#818cf8"', description: "Any CSS color." },
    ],
    Demo: SplitButtonDemo,
  },
  {
    slug: "product-card",
    name: "Product Card",
    type: "card",
    week: 5,
    description:
      "A shop product card with a swipeable gallery per color, color and size pickers with stock levels, a quantity stepper, wishlist toggle, sale badge, rating and async add to cart.",
    sourceFile: "src/components/ui/product-card.tsx",
    usage: `"use client";

import { ProductCard } from "@/components/ui/product-card";

export function Sneaker({ product }: { product: Product }) {
  return (
    <ProductCard
      brand="Lofi Runners"
      name={product.name}
      price={96}
      compareAtPrice={120}          // shows -20% and a strike-through
      rating={{ value: 4.6, count: 1284 }}
      colors={product.colors.map((c) => ({
        id: c.id,
        name: c.name,
        swatch: c.hex,
        images: c.photos.map((src) => <img key={src} src={src} alt="" className="size-full object-cover" />),
      }))}
      sizes={product.sizes}         // [{ id, label, stock }]
      onAddToCart={({ colorId, sizeId, quantity }) => cart.add(product.id, colorId, sizeId, quantity)}
    />
  );
}`,
    props: [
      {
        name: "name / brand",
        type: "string",
        description: "Product name (also the card's accessible name) and brand.",
      },
      {
        name: "price / compareAtPrice",
        type: "number",
        description: "A higher compareAtPrice adds a strike-through and % off badge.",
      },
      {
        name: "currency / locale",
        type: "string",
        default: '"USD" / "en-US"',
        description: "Passed to Intl.NumberFormat.",
      },
      { name: "rating", type: "{ value: number; count: number }", description: "Partial stars, spoken as a sentence." },
      {
        name: "colors",
        type: "{ id; name; swatch; images: ReactNode[] }[]",
        description: "Each color has its own gallery.",
      },
      { name: "sizes", type: "{ id; label; stock }[]", description: "stock 0 is sold out and skipped by arrow keys." },
      {
        name: "onAddToCart",
        type: "({ colorId, sizeId, quantity }) => void | Promise<void>",
        description: "Adding…, then Added, or the error.",
      },
      { name: "badge", type: "string", description: "Label over the image, e.g. New." },
      {
        name: "lowStockAt / maxQuantity",
        type: "number",
        default: "3 / 10",
        description: "Low stock warning and stepper cap.",
      },
      { name: "defaultWishlisted / onWishlistChange", type: "boolean / (saved) => void", description: "Heart toggle." },
      { name: "accent", type: "string", default: '"#a78bfa"', description: "Any CSS color." },
    ],
    Demo: ProductCardDemo,
  },
  {
    slug: "donut-chart",
    name: "Interactive Donut Chart",
    type: "chart",
    week: 5,
    description:
      "A donut chart whose legend toggles series on and off with animated slices, a center readout for the hovered slice, and a hidden data table so screen readers get the same numbers.",
    sourceFile: "src/components/ui/donut-chart.tsx",
    usage: `import { DonutChart } from "@/components/ui/donut-chart";

export function TrafficSources({ rows }: { rows: { source: string; visits: number }[] }) {
  return (
    <DonutChart
      title="Visitors by source, last 30 days"
      totalLabel="Visitors"
      data={rows.map((r) => ({ id: r.source, label: r.source, value: r.visits }))}
      formatValue={(n) => n.toLocaleString()}
      onHiddenChange={(ids) => console.log("hidden", ids)}
    />
  );
}`,
    props: [
      {
        name: "data",
        type: "{ id; label; value; color? }[]",
        description: "Missing colors come from a dark-friendly palette.",
      },
      { name: "title", type: "string", description: "Legend heading and caption of the screen reader table." },
      { name: "formatValue", type: "(n) => string", description: "Used in the center, legend and table." },
      { name: "totalLabel", type: "string", default: '"Total"', description: "Center label when nothing is hovered." },
      {
        name: "size / thickness",
        type: "number",
        default: "240 / 28",
        description: "Diameter and ring width in px. Shrinks to fit.",
      },
      { name: "sortByValue", type: "boolean", default: "true", description: "Largest slice first, from 12 o'clock." },
      { name: "defaultHidden", type: "string[]", default: "[]", description: "Series hidden on first render." },
      { name: "onHiddenChange", type: "(ids: string[]) => void", description: "Fires when a legend item is toggled." },
    ],
    Demo: DonutChartDemo,
  },
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
