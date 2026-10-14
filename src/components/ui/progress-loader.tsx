"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";

export interface LoaderStage {
  id: string;
  label: string;
  /** Shown under the active stage, e.g. "Compressing 24 images". */
  detail?: string;
}

export type LoaderStatus = "idle" | "running" | "paused" | "error" | "done";

export interface ProgressLoaderProps {
  title: string;
  stages: LoaderStage[];
  /** Index of the stage in progress. */
  current: number;
  /** 0 to 1 within the current stage, or null when it can't be measured (shows a moving bar). */
  progress: number | null;
  status: LoaderStatus;
  errorMessage?: string;
  /** Estimates time left from how fast progress has moved while running. */
  showEta?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  accent?: string;
  className?: string;
}

const TICK = 500;

function formatEta(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 5) return "A few seconds left";
  if (s < 60) return `About ${Math.ceil(s / 5) * 5}s left`;
  const m = Math.round(s / 60);
  return `About ${m} min left`;
}

function StageIcon({ state }: { state: "done" | "active" | "pending" | "error" | "paused" }) {
  if (state === "done")
    return (
      <span
        className="grid size-6 place-items-center rounded-full bg-[var(--pl-done)] text-zinc-950"
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  if (state === "error")
    return (
      <span className="grid size-6 place-items-center rounded-full bg-red-500/20 text-red-300" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </span>
    );
  if (state === "active" || state === "paused")
    return (
      <span className="relative grid size-6 place-items-center" aria-hidden="true">
        <span
          className={[
            "absolute inset-0 rounded-full border-2 border-[color-mix(in_oklab,var(--pl-accent)_25%,transparent)] border-t-[var(--pl-accent)]",
            state === "active" ? "animate-spin motion-reduce:animate-none" : "",
          ].join(" ")}
        />
        <span className="size-2 rounded-full bg-[var(--pl-accent)]" />
      </span>
    );
  return <span className="size-6 rounded-full border-2 border-zinc-700" aria-hidden="true" />;
}

export function ProgressLoader({
  title,
  stages,
  current,
  progress,
  status,
  errorMessage = "Something went wrong.",
  showEta = true,
  onPause,
  onResume,
  onCancel,
  onRetry,
  accent = "#38bdf8",
  className = "",
}: ProgressLoaderProps) {
  const id = useId();
  // Time spent actually running. Pauses don't count, so the estimate doesn't jump after a resume.
  const [activeMs, setActiveMs] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => setActiveMs((ms) => ms + TICK), TICK);
    return () => clearInterval(timer);
  }, [status]);

  const count = stages.length;
  const within = progress === null ? 0 : Math.min(Math.max(progress, 0), 1);
  const overall = status === "done" ? 1 : Math.min((current + within) / count, 1);
  const percent = Math.round(overall * 100);
  const activeStage = stages[Math.min(current, count - 1)];

  const eta =
    showEta && status === "running" && overall > 0.03 && activeMs >= 1500
      ? formatEta((activeMs * (1 - overall)) / overall)
      : null;

  const statusText =
    status === "done"
      ? "Complete"
      : status === "error"
        ? `Failed at ${activeStage.label}`
        : status === "paused"
          ? `Paused at ${activeStage.label}`
          : status === "idle"
            ? "Waiting to start"
            : activeStage.label;

  const buttonClass =
    "h-8 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-accent)]";

  return (
    <section
      aria-labelledby={`${id}-title`}
      // Finished stages keep the accent; only the stage that failed turns red.
      style={{ "--pl-done": accent, "--pl-accent": status === "error" ? "#f87171" : accent } as CSSProperties}
      className={["w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6", className].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="break-words font-semibold text-zinc-50">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-400" aria-live="polite">
            {statusText}
            {status === "running" && progress === null && "…"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums text-zinc-50">{percent}%</p>
          <p className="min-h-4 text-xs text-zinc-500">{eta ?? (status === "paused" ? "Timer paused" : "")}</p>
        </div>
      </div>

      {/* One segment per stage */}
      <div
        role="progressbar"
        aria-labelledby={`${id}-title`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${statusText}, step ${Math.min(current + 1, count)} of ${count}, ${percent}%`}
        aria-busy={status === "running" || undefined}
        className="mt-4 flex gap-1"
      >
        {stages.map((stage, i) => {
          const fill = status === "done" || i < current ? 1 : i === current ? within : 0;
          const indeterminate = i === current && progress === null && status === "running";
          return (
            <div key={stage.id} className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
              {indeterminate ? (
                <div className="absolute inset-y-0 w-1/3 rounded-full bg-[var(--pl-accent)] [animation:pl-slide_1.2s_ease-in-out_infinite] motion-reduce:left-0 motion-reduce:w-full motion-reduce:opacity-50 motion-reduce:[animation:none]" />
              ) : (
                <div
                  className={[
                    "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
                    i === current && status !== "done" ? "bg-[var(--pl-accent)]" : "bg-[var(--pl-done)]",
                  ].join(" ")}
                  style={{ width: `${fill * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      <ol className="mt-5 space-y-3" role="list">
        {stages.map((stage, i) => {
          const state =
            status === "done" || i < current
              ? "done"
              : i === current
                ? status === "error"
                  ? "error"
                  : status === "paused"
                    ? "paused"
                    : status === "running"
                      ? "active"
                      : "pending"
                : "pending";
          return (
            <li key={stage.id} className="flex items-start gap-3">
              <StageIcon state={state} />
              <div className="min-w-0 pt-0.5">
                <p className={["text-sm", state === "pending" ? "text-zinc-500" : "text-zinc-100"].join(" ")}>
                  {stage.label}
                  <span className="sr-only">
                    {state === "done"
                      ? ", done"
                      : state === "error"
                        ? ", failed"
                        : state === "pending"
                          ? ", not started"
                          : ", in progress"}
                  </span>
                </p>
                {i === current && stage.detail && state !== "done" && state !== "pending" && (
                  <p className="mt-0.5 text-xs text-zinc-500">{stage.detail}</p>
                )}
              </div>
              {i === current && progress !== null && (state === "active" || state === "paused") && (
                <span className="ml-auto pt-0.5 text-xs tabular-nums text-zinc-500">{Math.round(within * 100)}%</span>
              )}
            </li>
          );
        })}
      </ol>

      {status === "error" && (
        <p role="alert" className="mt-5 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      {(status === "running" || status === "paused" || status === "error") && (
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {status === "running" && onPause && (
            <button type="button" onClick={onPause} className={buttonClass}>
              Pause
            </button>
          )}
          {status === "paused" && onResume && (
            <button type="button" onClick={onResume} className={buttonClass}>
              Resume
            </button>
          )}
          {status === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`${buttonClass} border-transparent bg-zinc-100 text-zinc-950 hover:bg-white`}
            >
              Retry from {activeStage.label}
            </button>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel} className={`${buttonClass} text-zinc-400`}>
              Cancel
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes pl-slide { 0% { left: -33% } 100% { left: 100% } }`}</style>
    </section>
  );
}

export default ProgressLoader;
