"use client";

import { useState } from "react";
import { UndoButton } from "@/components/ui/undo-button";

export default function UndoButtonDemo() {
  const [log, setLog] = useState<string[]>([]);
  const [failNext, setFailNext] = useState(false);
  const say = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4));

  const fakeRequest = async (what: string) => {
    const shouldFail = failNext;
    await new Promise((r) => setTimeout(r, 900));
    if (shouldFail) {
      setFailNext(false);
      throw new Error("The server didn't answer. Nothing was changed.");
    }
    say(`${what} ✓`);
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-10 sm:px-8">
      <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">Undo window</p>
          <p className="mb-4 text-xs text-zinc-500">Runs after 5 s unless you undo.</p>
          <UndoButton
            label="Send email"
            countdownLabel="Sending"
            doneLabel="Sent"
            onAction={() => fakeRequest("Email sent")}
            onUndo={() => say("Send undone")}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">Confirm, then undo</p>
          <p className="mb-4 text-xs text-zinc-500">Danger action: two clicks, then 4 s to undo.</p>
          <UndoButton
            label="Delete 12 files"
            tone="danger"
            confirm
            undoWindow={4000}
            countdownLabel="Deleting"
            doneLabel="Deleted"
            onAction={() => fakeRequest("Files deleted")}
            onUndo={() => say("Delete undone")}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200">No undo window</p>
          <p className="mb-4 text-xs text-zinc-500">Runs at once; double clicks are ignored.</p>
          <UndoButton label="Save draft" undoWindow={0} doneLabel="Saved" onAction={() => fakeRequest("Draft saved")} />
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-start justify-between gap-4 border-t border-zinc-800 pt-4">
        <ul className="min-h-16 space-y-1 text-sm text-zinc-400" aria-label="Activity">
          {log.length ? log.map((l, i) => <li key={i}>{l}</li>) : <li className="text-zinc-600">Nothing yet.</li>}
        </ul>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            className="size-4 accent-red-400"
          />
          Make the next action fail
        </label>
      </div>
    </div>
  );
}
