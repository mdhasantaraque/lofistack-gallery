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
| 3    | form   | Multi-Step Form Wizard | `/components/form-wizard`   | [form-wizard.tsx](src/components/ui/form-wizard.tsx)                   |
| 3    | table  | Smart Data Table      | `/components/data-table`     | [data-table.tsx](src/components/ui/data-table.tsx)                     |
| 3    | loader | Stepped Progress Loader | `/components/progress-loader` | [progress-loader.tsx](src/components/ui/progress-loader.tsx)       |
| 4    | navbar | Scrollspy Navbar      | `/components/scrollspy-navbar` | [scrollspy-navbar.tsx](src/components/ui/scrollspy-navbar.tsx)       |
| 4    | section | Searchable FAQ Section | `/components/faq-section`   | [faq-section.tsx](src/components/ui/faq-section.tsx)                   |
| 4    | input  | Mention Composer      | `/components/mention-composer` | [mention-composer.tsx](src/components/ui/mention-composer.tsx)       |
| 5    | button | Split Button          | `/components/split-button`   | [split-button.tsx](src/components/ui/split-button.tsx)                 |
| 5    | card   | Product Card          | `/components/product-card`   | [product-card.tsx](src/components/ui/product-card.tsx)                 |
| 5    | chart  | Interactive Donut Chart | `/components/donut-chart`  | [donut-chart.tsx](src/components/ui/donut-chart.tsx)                   |
| 6    | modal  | Command Palette       | `/components/command-palette` | [command-palette.tsx](src/components/ui/command-palette.tsx)        |
| 6    | form   | Profile Settings Form | `/components/settings-form`  | [settings-form.tsx](src/components/ui/settings-form.tsx)               |
| 6    | loader | File Upload Queue     | `/components/upload-queue`   | [upload-queue.tsx](src/components/ui/upload-queue.tsx)                 |
| 7    | table  | Plan Comparison Table | `/components/comparison-table` | [comparison-table.tsx](src/components/ui/comparison-table.tsx)       |
| 7    | navbar | Mega Menu Navbar      | `/components/mega-menu-navbar` | [mega-menu-navbar.tsx](src/components/ui/mega-menu-navbar.tsx)       |
| 7    | section | Changelog Section    | `/components/changelog-section` | [changelog-section.tsx](src/components/ui/changelog-section.tsx)    |
| 8    | input  | Date Range Picker     | `/components/date-range-picker` | [date-range-picker.tsx](src/components/ui/date-range-picker.tsx)    |
| 8    | chart  | Interactive Line Chart | `/components/line-chart`    | [line-chart.tsx](src/components/ui/line-chart.tsx)                     |
| 8    | modal  | Image Lightbox        | `/components/image-lightbox` | [image-lightbox.tsx](src/components/ui/image-lightbox.tsx)             |
| 9    | button | Undoable Action Button | `/components/undo-button`   | [undo-button.tsx](src/components/ui/undo-button.tsx)                   |
| 9    | card   | Social Post Card      | `/components/post-card`      | [post-card.tsx](src/components/ui/post-card.tsx)                       |
| 9    | navbar | Responsive Breadcrumbs | `/components/breadcrumbs`   | [breadcrumbs.tsx](src/components/ui/breadcrumbs.tsx)                   |

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
