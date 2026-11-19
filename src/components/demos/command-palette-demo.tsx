"use client";

import { useMemo, useState } from "react";
import { CommandPalette, type Command } from "@/components/ui/command-palette";

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
    <path fillRule="evenodd" d={d} clipRule="evenodd" />
  </svg>
);

const ICONS = {
  page: icon("M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Zm1 3h10v2H5V6Zm0 4h6v2H5v-2Z"),
  plus: icon("M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z"),
  theme: icon("M10 2a8 8 0 1 0 0 16V2Z"),
  user: icon("M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 1 1 14 0H3Z"),
  bolt: icon("M11 1 3 11h6l-1 8 8-10h-6l1-8Z"),
};

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(["go-settings"]);
  const [theme, setTheme] = useState("Dark");
  const [log, setLog] = useState("Nothing run yet.");

  const commands = useMemo<Command[]>(() => {
    const say = (msg: string) => () => setLog(msg);
    return [
      {
        id: "go-dashboard",
        label: "Go to Dashboard",
        group: "Navigation",
        icon: ICONS.page,
        shortcut: ["G", "D"],
        perform: say("Opened Dashboard"),
      },
      {
        id: "go-projects",
        label: "Go to Projects",
        group: "Navigation",
        icon: ICONS.page,
        shortcut: ["G", "P"],
        perform: say("Opened Projects"),
      },
      {
        id: "go-settings",
        label: "Go to Settings",
        group: "Navigation",
        icon: ICONS.page,
        keywords: "preferences account",
        shortcut: ["G", "S"],
        perform: say("Opened Settings"),
      },
      {
        id: "new-project",
        label: "Create new project",
        group: "Actions",
        icon: ICONS.plus,
        keywords: "add start",
        shortcut: ["Ctrl", "N"],
        perform: say("Created a project"),
      },
      {
        id: "invite",
        label: "Invite teammate",
        group: "Actions",
        icon: ICONS.user,
        keywords: "member people add",
        perform: say("Invite sent"),
      },
      {
        id: "deploy",
        label: "Deploy to production",
        group: "Actions",
        icon: ICONS.bolt,
        keywords: "release ship publish",
        perform: say("Deploy started"),
      },
      {
        id: "theme",
        label: "Change theme",
        group: "Preferences",
        icon: ICONS.theme,
        keywords: "dark light appearance color",
        children: ["Dark", "Light", "System", "High contrast"].map((t) => ({
          id: `theme-${t}`,
          label: `${t}${t === theme ? " (current)" : ""}`,
          perform: () => {
            setTheme(t);
            setLog(`Theme set to ${t}`);
          },
        })),
      },
      {
        id: "lang",
        label: "Change language",
        group: "Preferences",
        keywords: "locale translate",
        children: ["English", "বাংলা", "Deutsch", "Español", "日本語"].map((l) => ({
          id: `lang-${l}`,
          label: l,
          perform: say(`Language set to ${l}`),
        })),
      },
    ];
  }, [theme]);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-12 text-center sm:px-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-full max-w-sm items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-sm text-zinc-400 hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.13 3.14a.75.75 0 1 0 1.06-1.06l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">Search commands…</span>
        <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 font-sans text-xs text-zinc-500">Ctrl K</kbd>
      </button>
      <p className="mt-4 text-sm text-zinc-500">
        Or press <kbd className="font-sans text-zinc-300">Ctrl</kbd>+<kbd className="font-sans text-zinc-300">K</kbd> (
        <kbd className="font-sans text-zinc-300">⌘K</kbd> on Mac). Try typing “gs”, “dark” or “ship”.
      </p>
      <p className="mt-6 text-sm text-zinc-300" aria-live="polite">
        {log} <span className="text-zinc-600">· theme: {theme}</span>
      </p>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
        recentIds={recent}
        onRun={(c) => {
          const top = c.id.startsWith("theme-") ? "theme" : c.id.startsWith("lang-") ? "lang" : c.id;
          setRecent((r) => [top, ...r.filter((x) => x !== top)].slice(0, 3));
        }}
      />
    </div>
  );
}
