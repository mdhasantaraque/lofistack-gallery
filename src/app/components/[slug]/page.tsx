import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/site/code-block";
import { sources } from "@/generated/sources";
import { getEntry, registry } from "@/lib/registry";
import { repoFileUrl } from "@/lib/site";

export function generateStaticParams() {
  return registry.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps<"/components/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  return entry ? { title: entry.name, description: entry.description } : {};
}

export default async function ComponentPage({ params }: PageProps<"/components/[slug]">) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const source = sources[entry.sourceFile] ?? "";
  const { Demo } = entry;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/components" className="hover:text-zinc-200">
          Components
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-zinc-300">{entry.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-zinc-300">
              {entry.type}
            </span>
            <span className="text-zinc-500">Week {entry.week}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{entry.name}</h1>
          <p className="mt-3 leading-relaxed text-zinc-400">{entry.description}</p>
        </div>
        <a
          href={repoFileUrl(entry.sourceFile)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center self-start rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:self-auto"
        >
          View source on GitHub
        </a>
      </header>

      <section aria-labelledby="preview-heading" className="mt-10">
        <h2 id="preview-heading" className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Live preview
        </h2>
        <div className="rounded-2xl border border-zinc-800 p-2 sm:p-3">
          <Demo />
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section aria-labelledby="usage-heading" className="min-w-0">
          <h2 id="usage-heading" className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Usage
          </h2>
          <CodeBlock code={entry.usage} title="example.tsx" />
        </section>

        <section aria-labelledby="props-heading" className="min-w-0">
          <h2 id="props-heading" className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Props
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Prop
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Default
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {entry.props.map((prop) => (
                  <tr key={prop.name} className="align-top">
                    <td className="px-4 py-3">
                      <code className="font-mono text-violet-300">{prop.name}</code>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{prop.description}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{prop.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{prop.default ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section aria-labelledby="source-heading" className="mt-10">
        <h2 id="source-heading" className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Source
        </h2>
        <CodeBlock code={source} title={entry.sourceFile} maxHeight={560} />
      </section>
    </div>
  );
}
