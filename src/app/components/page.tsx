import type { Metadata } from "next";
import { ComponentGrid } from "@/components/site/component-grid";

export const metadata: Metadata = { title: "Components" };

export default function ComponentsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-50">Components</h1>
      <ComponentGrid />
    </div>
  );
}
