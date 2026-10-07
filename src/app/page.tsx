import { ComponentGrid } from "@/components/site/component-grid";
import { registry } from "@/lib/registry";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <section className="max-w-2xl">
        <p className="text-sm font-medium text-violet-300">LofiStack 90 Day Build Challenge</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">{site.name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Reusable React, TypeScript and Tailwind components by {site.author}. Two new components every week, each with
          its own page, a live preview and the full source.
        </p>
        <p className="mt-6 text-sm text-zinc-500">{registry.length} of 30 components shipped</p>
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
            style={{ width: `${(registry.length / 30) * 100}%` }}
          />
        </div>
      </section>

      <section className="mt-14" aria-labelledby="components-heading">
        <h2 id="components-heading" className="mb-6 text-xl font-semibold text-zinc-50">
          Components
        </h2>
        <ComponentGrid />
      </section>
    </div>
  );
}
