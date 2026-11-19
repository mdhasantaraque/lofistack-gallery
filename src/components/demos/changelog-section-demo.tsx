"use client";

import { ChangelogSection, type ChangelogEntry } from "@/components/ui/changelog-section";

const entries: ChangelogEntry[] = [
  {
    version: "2.6.0",
    date: "2026-11-18",
    title: "Command palette and faster search",
    summary: "Press Ctrl+K anywhere to jump to a page or run an action.",
    changes: [
      { kind: "new", text: "Command palette with fuzzy search and nested pages." },
      { kind: "new", text: "Recent commands show at the top." },
      { kind: "improved", text: "Search results load about 3× faster on large workspaces." },
      { kind: "improved", text: "Keyboard shortcuts are listed next to each command." },
      { kind: "fixed", text: "Search no longer skips projects with emoji in the name." },
      { kind: "fixed", text: "Typing quickly no longer shows results for an older query." },
    ],
  },
  {
    version: "2.5.2",
    date: "2026-11-04",
    title: "Upload fixes",
    changes: [
      { kind: "fixed", text: "Large uploads no longer stall at 99% on slow connections." },
      { kind: "security", text: "Uploaded SVG files are now sanitized before preview." },
    ],
  },
  {
    version: "2.5.0",
    date: "2026-10-21",
    title: "Upload queue",
    summary: "Upload many files at once, with progress for each one.",
    changes: [
      { kind: "new", text: "Drag in up to 20 files and they upload two at a time." },
      { kind: "new", text: "Cancel or retry any file without starting over." },
      { kind: "improved", text: "Clearer errors for files that are too large." },
    ],
  },
  {
    version: "2.4.1",
    date: "2026-10-09",
    title: "Security update",
    changes: [
      { kind: "security", text: "Updated the web framework to a patched release." },
      { kind: "fixed", text: "Sessions now expire correctly after a password change." },
    ],
  },
  {
    version: "2.4.0",
    date: "2026-09-26",
    title: "Profile settings",
    changes: [
      { kind: "new", text: "Unsaved-changes bar with Undo for each field." },
      { kind: "improved", text: "Username check tells you right away if a name is taken." },
    ],
  },
  {
    version: "2.3.0",
    date: "2026-09-08",
    title: "Comparison tables",
    changes: [
      { kind: "new", text: "Compare plans side by side, with an Only differences switch." },
      { kind: "fixed", text: "Sticky table headers no longer overlap tooltips." },
    ],
  },
];

export default function ChangelogSectionDemo() {
  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <ChangelogSection
        title="What's new"
        description="Every release, newest first. Filter by type or share a link to one release."
        entries={entries}
        pageSize={3}
      />
    </div>
  );
}
