"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Phase = "idle" | "armed" | "countdown" | "pending" | "done" | "error";

export interface UndoButtonProps {
  label: string;
  /** Runs only after the undo window ends. May return a promise; a rejection shows the retry state. */
  onAction: () => void | Promise<void>;
  /** Fires when the user undoes during the countdown. */
  onUndo?: () => void;
  /** How long the user can undo, in ms. 0 runs right away. */
  undoWindow?: number;
  /** Ask for a second click within 3 s before starting. */
  confirm?: boolean;
  /** Shown during the undo window, e.g. "Sending". */
  countdownLabel?: string;
  pendingLabel?: string;
  doneLabel?: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  className?: string;
}

const ARM_TIMEOUT = 3000;
const DONE_RESET = 2200;

export function UndoButton({
  label,
  onAction,
  onUndo,
  undoWindow = 5000,
  confirm = false,
  countdownLabel = "Sending",
  pendingLabel = "Working…",
  doneLabel = "Done",
  icon,
  tone = "default",
  disabled = false,
  className = "",
}: UndoButtonProps) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const deadline = useRef(0);
  const actionRef = useRef(onAction);
  useEffect(() => {
    actionRef.current = onAction;
  });

  const run = async () => {
    setPhase("pending");
    setNotice(pendingLabel);
    try {
      await actionRef.current();
      setPhase("done");
      setNotice(doneLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
      setNotice("Failed. Retry is available.");
    }
  };

  // Count down while in the undo window. The timer callback, not render, decides when time is up.
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = window.setInterval(() => {
      const left = deadline.current - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        void run();
      } else setRemaining(left);
    }, 100);
    return () => clearInterval(timer);
    // `run` only reads refs and setters, so the timer doesn't need to restart when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // A confirm click expires, and a finished state resets itself.
  useEffect(() => {
    if (phase !== "armed" && phase !== "done") return;
    const timer = window.setTimeout(
      () => {
        setPhase("idle");
        setNotice("");
      },
      phase === "armed" ? ARM_TIMEOUT : DONE_RESET,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  const start = () => {
    setError(null);
    if (undoWindow <= 0) return void run();
    deadline.current = Date.now() + undoWindow;
    setRemaining(undoWindow);
    setPhase("countdown");
    setNotice(`${countdownLabel}. Undo within ${Math.round(undoWindow / 1000)} seconds.`);
  };

  const undo = () => {
    setPhase("idle");
    setNotice("Undone. Nothing was sent.");
    onUndo?.();
  };

  const onClick = () => {
    if (phase === "idle") {
      if (confirm) {
        setPhase("armed");
        setNotice("Click again to confirm.");
      } else start();
    } else if (phase === "armed") start();
    else if (phase === "countdown") undo();
    else if (phase === "error") start();
  };

  const danger = tone === "danger";
  const seconds = Math.ceil(remaining / 1000);
  const busy = phase === "pending";

  const text = {
    idle: label,
    armed: "Click again to confirm",
    countdown: `${countdownLabel}… Undo (${seconds})`,
    pending: pendingLabel,
    done: `✓ ${doneLabel}`,
    error: "Failed · Retry",
  }[phase];

  return (
    <div className={["inline-flex flex-col items-start gap-1.5", className].join(" ")}>
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(e) => e.key === "Escape" && phase === "countdown" && (e.preventDefault(), undo())}
        disabled={disabled || busy || phase === "done"}
        aria-busy={busy || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{ "--ub-progress": phase === "countdown" ? remaining / undoWindow : 0 } as CSSProperties}
        className={[
          "relative isolate inline-flex h-10 min-w-44 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 text-sm font-semibold tabular-nums transition-[background-color,color,transform] duration-200 active:scale-[0.98] motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed",
          phase === "armed"
            ? "bg-amber-400 text-zinc-950 focus-visible:ring-amber-300"
            : phase === "countdown"
              ? "border border-zinc-600 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-300"
              : phase === "done"
                ? "bg-emerald-500 text-zinc-950"
                : phase === "error"
                  ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/50 focus-visible:ring-red-300"
                  : danger
                    ? "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-300"
                    : "bg-zinc-100 text-zinc-950 hover:bg-white focus-visible:ring-zinc-300",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        {/* Time left in the undo window, as a bar that shrinks. */}
        {phase === "countdown" && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 -z-10 bg-zinc-700/70 transition-[width] duration-100 ease-linear motion-reduce:transition-none"
            style={{ width: "calc(var(--ub-progress) * 100%)" }}
          />
        )}
        {busy ? (
          <svg
            className="size-4 animate-spin motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          phase === "idle" && icon
        )}
        {text}
      </button>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      {phase === "error" && error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
      {phase === "countdown" && <p className="text-xs text-zinc-500">Press again or Escape to undo</p>}
    </div>
  );
}

export default UndoButton;
