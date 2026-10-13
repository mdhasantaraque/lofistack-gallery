"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

export type ConfirmGuard =
  | { kind: "none" }
  /** User must type `phrase` exactly, e.g. the project name. */
  | { kind: "type"; phrase: string }
  /** User must press and hold the confirm button for `duration` ms. */
  | { kind: "hold"; duration?: number };

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Bullet list of what will happen, shown in a callout. */
  consequences?: string[];
  /** Extra friction before the confirm button works. */
  guard?: ConfirmGuard;
  tone?: "danger" | "neutral";
  confirmLabel?: string;
  cancelLabel?: string;
  /** May return a promise. The dialog shows a spinner, then closes on success or shows the error. */
  onConfirm: () => void | Promise<void>;
  className?: string;
}

const toneVars: Record<NonNullable<ConfirmDialogProps["tone"]>, CSSProperties> = {
  danger: { "--cd-accent": "#f87171", "--cd-accent-strong": "#dc2626" } as CSSProperties,
  neutral: { "--cd-accent": "#a78bfa", "--cd-accent-strong": "#7c3aed" } as CSSProperties,
};

function Spinner() {
  return (
    <svg className="size-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  guard = { kind: "none" },
  tone = "danger",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  className = "",
}: ConfirmDialogProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const holdTimer = useRef(0);
  const [typed, setTyped] = useState("");
  const [holding, setHolding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holdDuration = guard.kind === "hold" ? (guard.duration ?? 1500) : 0;
  const guardMet = guard.kind !== "type" || typed === guard.phrase;

  // Keep the native <dialog> in sync with the `open` prop. showModal() gives focus trapping,
  // Escape handling, an inert page behind it, the ::backdrop, focus on the first field and
  // focus returned to the trigger on close, all for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const resetState = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = 0;
    setTyped("");
    setHolding(false);
    setPending(false);
    setError(null);
  };

  const requestClose = () => {
    if (pending) return;
    onOpenChange(false);
  };

  const runConfirm = async () => {
    if (pending || !guardMet) return;
    setError(null);
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      onOpenChange(false);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  // The timer decides when the hold is done; the fill is just a CSS transition of the same length.
  const startHold = () => {
    if (pending || holdTimer.current) return;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = 0;
      setHolding(false);
      void runConfirm();
    }, holdDuration);
  };

  const cancelHold = () => {
    if (!holdTimer.current) return;
    clearTimeout(holdTimer.current);
    holdTimer.current = 0;
    setHolding(false);
  };

  const onHoldKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (!e.repeat) startHold();
  };

  const onHoldKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") cancelHold();
  };

  // A click on the dialog element itself (not its content) is a click on the backdrop.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) requestClose();
  };

  const confirmDisabled = pending || !guardMet;
  const isHold = guard.kind === "hold";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClick={onDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={resetState}
      style={toneVars[tone]}
      className={[
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 shadow-2xl",
        "backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        "opacity-100 scale-100 transition-[opacity,scale] duration-200 ease-out starting:opacity-0 starting:scale-95",
        "motion-reduce:transition-none",
        className,
      ].join(" ")}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--cd-accent)_15%,transparent)] text-[var(--cd-accent)]"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path
                fillRule="evenodd"
                d="M8.48 2.89a1.75 1.75 0 0 1 3.04 0l6.28 11.03A1.75 1.75 0 0 1 16.28 16.5H3.72a1.75 1.75 0 0 1-1.52-2.58L8.48 2.89ZM10 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 7Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-semibold text-zinc-50">
              {title}
            </h2>
            {description && (
              <div id={`${id}-desc`} className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {description}
              </div>
            )}
          </div>
        </div>

        {consequences && consequences.length > 0 && (
          <ul
            className="mt-5 space-y-1.5 rounded-xl border border-[color-mix(in_oklab,var(--cd-accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--cd-accent)_8%,transparent)] p-4 text-sm text-zinc-300"
            role="list"
          >
            {consequences.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--cd-accent)]">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}

        {guard.kind === "type" && (
          <label className="mt-5 block text-sm text-zinc-400">
            Type{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">
              {guard.phrase}
            </code>{" "}
            to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runConfirm()}
              disabled={pending}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={typed.length > 0 && !guardMet ? true : undefined}
              className="mt-2 block h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 font-mono text-sm text-zinc-100 focus-visible:border-[var(--cd-accent)] focus-visible:outline-none aria-invalid:border-amber-500/70"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={requestClose}
            disabled={pending}
            className="h-10 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={isHold ? undefined : () => void runConfirm()}
            onPointerDown={isHold ? startHold : undefined}
            onPointerUp={isHold ? cancelHold : undefined}
            onPointerLeave={isHold ? cancelHold : undefined}
            onPointerCancel={isHold ? cancelHold : undefined}
            onKeyDown={isHold ? onHoldKeyDown : undefined}
            onKeyUp={isHold ? onHoldKeyUp : undefined}
            onContextMenu={isHold ? (e) => e.preventDefault() : undefined}
            disabled={confirmDisabled}
            aria-describedby={isHold ? `${id}-hold-hint` : undefined}
            className="relative isolate inline-flex h-10 touch-none items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--cd-accent-strong)] px-4 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 motion-reduce:transition-none"
          >
            {isHold && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 -z-10 bg-black/30"
                style={{
                  width: holding || pending ? "100%" : "0%",
                  transition: `width ${holding ? holdDuration : 150}ms linear`,
                }}
              />
            )}
            {pending && <Spinner />}
            {pending ? "Working…" : isHold ? `Hold to ${confirmLabel.toLowerCase()}` : confirmLabel}
          </button>
        </div>
        {isHold && (
          <p id={`${id}-hold-hint`} className="mt-2 text-right text-xs text-zinc-500">
            Press and hold for {(holdDuration / 1000).toFixed(1)}s, or hold Space / Enter
          </p>
        )}
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
