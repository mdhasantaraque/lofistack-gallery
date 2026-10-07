import Link from "next/link";
import { registry } from "@/lib/registry";

export function ComponentGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {registry.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/components/${entry.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-zinc-300">
                {entry.type}
              </span>
              <span className="text-zinc-500">Week {entry.week}</span>
            </div>
            <h3 className="mt-4 font-semibold text-zinc-50">{entry.name}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{entry.description}</p>
            <span className="mt-4 text-sm font-medium text-violet-300 group-hover:text-violet-200">
              View component <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
