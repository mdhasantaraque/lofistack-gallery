# LofiStack Gallery

Component gallery for the LofiStack 90 Day Build Challenge, built by Md. Hasan Taraque.

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS · deployed on Vercel.

## Components

| Week | Type   | Component             | Page                         | Source                                                                 |
| ---- | ------ | --------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| 1    | button | Glass Button          | `/components/glass-button`   | [glass-button.tsx](src/components/ui/glass-button.tsx)                 |
| 1    | card   | Animated Pricing Card | `/components/pricing-card`   | [pricing-card.tsx](src/components/ui/pricing-card.tsx)                 |
| 2    | input  | Histogram Range Slider | `/components/range-slider`  | [range-slider.tsx](src/components/ui/range-slider.tsx)                 |
| 2    | modal  | Destructive Confirm Dialog | `/components/confirm-dialog` | [confirm-dialog.tsx](src/components/ui/confirm-dialog.tsx)         |
| 2    | chart  | Activity Heatmap      | `/components/activity-heatmap` | [activity-heatmap.tsx](src/components/ui/activity-heatmap.tsx)       |

## Adding a component

1. Put the component in `src/components/ui/<slug>.tsx` with typed props.
2. Put its interactive preview in `src/components/demos/<slug>-demo.tsx`.
3. Add an entry to `src/lib/registry.tsx` (slug, type, week, usage snippet, props).

The page at `/components/<slug>` is generated from the registry. `npm run dev` and `npm run build` bundle the source files shown on each page (`scripts/generate-sources.mjs`).

## Run locally

```bash
npm install
npm run dev
```
