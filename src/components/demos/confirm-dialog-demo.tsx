"use client";

import { useState } from "react";
import { ConfirmDialog, type ConfirmGuard } from "@/components/ui/confirm-dialog";

type Scenario = "type" | "hold" | "plain";

const scenarios: Record<
  Scenario,
  {
    button: string;
    title: string;
    description: string;
    consequences?: string[];
    guard: ConfirmGuard;
    tone: "danger" | "neutral";
    confirmLabel: string;
  }
> = {
  type: {
    button: "Delete project",
    title: "Delete lofistack-gallery?",
    description: "This permanently deletes the project and everything in it. This can't be undone.",
    consequences: ["30 components and their demos", "All deployments and preview URLs", "4 team members lose access"],
    guard: { kind: "type", phrase: "lofistack-gallery" },
    tone: "danger",
    confirmLabel: "Delete project",
  },
  hold: {
    button: "Revoke API keys",
    title: "Revoke all API keys?",
    description: "Every app using these keys stops working right away.",
    consequences: ["3 production keys", "Webhooks stop receiving events"],
    guard: { kind: "hold", duration: 1500 },
    tone: "danger",
    confirmLabel: "Revoke",
  },
  plain: {
    button: "Archive chat",
    title: "Archive this chat?",
    description: "You can find it later under Archived. Nobody else is notified.",
    guard: { kind: "none" },
    tone: "neutral",
    confirmLabel: "Archive",
  },
};

export default function ConfirmDialogDemo() {
  // The dialog stays mounted so its close animation and focus return work; `active` keeps its content.
  const [active, setActive] = useState<Scenario>("type");
  const [open, setOpen] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const scenario = scenarios[active];

  const handleConfirm = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    if (failNext) {
      setFailNext(false);
      throw new Error("Network error: the server didn't respond. Nothing was changed.");
    }
    setLog((l) => [`${scenario.confirmLabel} done`, ...l].slice(0, 3));
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-3">
          {(Object.keys(scenarios) as Scenario[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActive(key);
                setOpen(true);
              }}
              className={[
                "h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                scenarios[key].tone === "danger"
                  ? "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
              ].join(" ")}
            >
              {scenarios[key].button}
            </button>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            className="size-4 accent-red-400"
          />
          Make the next confirm fail (shows the error state)
        </label>

        <ul className="min-h-16 text-center text-sm text-zinc-500" aria-live="polite">
          {log.length === 0 ? <li>Pick an action above.</li> : log.map((entry, i) => <li key={i}>✓ {entry}</li>)}
        </ul>
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={scenario.title}
        description={scenario.description}
        consequences={scenario.consequences}
        guard={scenario.guard}
        tone={scenario.tone}
        confirmLabel={scenario.confirmLabel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
