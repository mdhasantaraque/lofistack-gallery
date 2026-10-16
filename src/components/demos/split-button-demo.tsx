"use client";

import { useState } from "react";
import { SplitButton, type SplitButtonAction } from "@/components/ui/split-button";

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
    <path fillRule="evenodd" d={d} clipRule="evenodd" />
  </svg>
);

export default function SplitButtonDemo() {
  const [log, setLog] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const say = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4));

  const saveActions: SplitButtonAction[] = [
    {
      id: "save",
      label: "Save",
      onSelect: () => {
        setSaving(true);
        window.setTimeout(() => {
          setSaving(false);
          say("Saved");
        }, 1200);
      },
    },
    {
      id: "draft",
      label: "Save as draft",
      shortcut: "Ctrl+Shift+S",
      icon: icon(
        "M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7.4a1 1 0 0 0-.3-.7l-3.4-3.4a1 1 0 0 0-.7-.3H4Zm2 1.5h6v3H6v-3Z",
      ),
      onSelect: () => say("Saved as draft"),
    },
    {
      id: "publish",
      label: "Save and publish",
      shortcut: "Ctrl+Enter",
      icon: icon(
        "M10 2a1 1 0 0 1 .7.3l4 4a1 1 0 0 1-1.4 1.4L11 5.4V13a1 1 0 1 1-2 0V5.4L6.7 7.7a1 1 0 0 1-1.4-1.4l4-4A1 1 0 0 1 10 2ZM4 15a1 1 0 0 1 1 1v.5h10V16a1 1 0 1 1 2 0v1.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V16a1 1 0 0 1 1-1Z",
      ),
      onSelect: () => say("Saved and published"),
    },
    {
      id: "schedule",
      label: "Schedule…",
      description: "Needs a Pro plan",
      disabled: true,
      onSelect: () => {},
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: icon(
        "M7 2a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V6.4a2 2 0 0 0-.6-1.4l-2.4-2.4A2 2 0 0 0 11.6 2H7Z",
      ),
      onSelect: () => say("Duplicated"),
    },
    {
      id: "delete",
      label: "Delete",
      danger: true,
      icon: icon(
        "M8 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0 0 2h.1l.8 10.1A2 2 0 0 0 6.9 18h6.2a2 2 0 0 0 2-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Z",
      ),
      onSelect: () => say("Deleted"),
    },
  ];

  const mergeActions: SplitButtonAction[] = [
    {
      id: "merge",
      label: "Create a merge commit",
      description: "All commits from this branch are added to the base branch with a merge commit.",
      onSelect: () => say("Merged with a merge commit"),
    },
    {
      id: "squash",
      label: "Squash and merge",
      description: "The 6 commits are combined into 1 commit in the base branch.",
      onSelect: () => say("Squashed and merged"),
    },
    {
      id: "rebase",
      label: "Rebase and merge",
      description: "The 6 commits are rebased and added to the base branch.",
      onSelect: () => say("Rebased and merged"),
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-10 sm:px-8">
      <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">Menu mode</p>
          <p className="mb-4 text-xs text-zinc-500">Main action plus related ones. Try ↓, letters, Escape.</p>
          <SplitButton actions={saveActions} loading={saving} align="start" menuLabel="More save options" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">Choice mode</p>
          <p className="mb-4 text-xs text-zinc-500">The menu picks what the button does, and it stays picked.</p>
          <SplitButton
            actions={mergeActions}
            mode="choice"
            defaultActionId="squash"
            accent="#34d399"
            menuLabel="Select merge method"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <SplitButton
            size="sm"
            accent="#38bdf8"
            actions={[
              { id: "export", label: "Export CSV", onSelect: () => say("Exported CSV") },
              { id: "xlsx", label: "Export Excel", onSelect: () => say("Exported Excel") },
              { id: "pdf", label: "Export PDF", onSelect: () => say("Exported PDF") },
            ]}
            menuLabel="More export formats"
            align="start"
          />
          <SplitButton
            size="sm"
            disabled
            actions={[
              { id: "deploy", label: "Deploy", onSelect: () => {} },
              { id: "preview", label: "Deploy preview", onSelect: () => {} },
            ]}
          />
          <span className="text-xs text-zinc-500">Small size and disabled state</span>
        </div>
      </div>
      <ul className="mx-auto mt-8 min-h-20 max-w-3xl space-y-1 text-sm text-zinc-500" aria-live="polite">
        {log.length === 0 ? <li>Nothing yet.</li> : log.map((l, i) => <li key={i}>✓ {l}</li>)}
      </ul>
    </div>
  );
}
