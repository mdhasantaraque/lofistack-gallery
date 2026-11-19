"use client";

import { useState } from "react";
import { SettingsForm, type ProfileSettings } from "@/components/ui/settings-form";

const TAKEN = ["admin", "hasan", "lofistack", "support", "root"];

const initial: ProfileSettings = {
  avatarUrl: null,
  name: "Md. Hasan Taraque",
  username: "taraque",
  email: "hasan@example.com",
  bio: "Building one component at a time for the LofiStack 90 Day Build Challenge.",
  website: "",
  timezone: "Asia/Dhaka",
  emailDigest: true,
  mentions: false,
};

export default function SettingsFormDemo() {
  const [failNext, setFailNext] = useState(false);
  const [lastSave, setLastSave] = useState<string | null>(null);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <SettingsForm
          initialValues={initial}
          checkUsername={async (name) => {
            await new Promise((r) => setTimeout(r, 500));
            return !TAKEN.includes(name);
          }}
          onSave={async (values, file) => {
            const shouldFail = failNext;
            await new Promise((r) => setTimeout(r, 900));
            if (shouldFail) {
              setFailNext(false);
              throw new Error("The server didn't respond. Your edits are still here, so try again.");
            }
            setLastSave(`${values.name} (@${values.username})${file ? `, new photo ${file.name}` : ""}`);
          }}
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
          <span aria-live="polite">
            {lastSave ? `onSave received: ${lastSave}` : `Taken usernames in this demo: ${TAKEN.join(", ")}`}
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={failNext}
              onChange={(e) => setFailNext(e.target.checked)}
              className="size-4 accent-emerald-400"
            />
            Make the next save fail
          </label>
        </div>
      </div>
    </div>
  );
}
