"use client";

import { useState } from "react";
import { OtpForm } from "@/components/ui/otp-form";

const CODE = "482913";

export default function OtpFormDemo() {
  const [round, setRound] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const note = (m: string) => setLog((l) => [m, ...l].slice(0, 4));

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <OtpForm
          key={round}
          description={
            <>
              We sent a 6-digit code to <span className="text-zinc-200">h•••@example.com</span>. The demo code is{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-100">{CODE}</code>.
            </>
          }
          resendAfter={15}
          maxAttempts={3}
          onVerify={async (code) => {
            await new Promise((r) => setTimeout(r, 700));
            note(`onVerify("${code}") → ${code === CODE ? "correct" : "wrong"}`);
            return code === CODE;
          }}
          onResend={async () => {
            await new Promise((r) => setTimeout(r, 500));
            note("onResend → new code sent");
          }}
        />
        <div className="flex w-full items-start justify-between gap-3 text-xs text-zinc-500">
          <ul className="min-h-14 space-y-0.5" aria-label="Events">
            {log.length ? (
              log.map((l, i) => <li key={i}>{l}</li>)
            ) : (
              <li>Type, or paste the whole code into any box.</li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => {
              setRound((r) => r + 1);
              setLog([]);
            }}
            className="shrink-0 rounded px-2 py-1 text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}
