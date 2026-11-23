"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading, also the accessible name of the sheet. */
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Sticks to the bottom, e.g. an apply button. */
  footer?: ReactNode;
  /** Heights as fractions of the screen, smallest first. */
  snapPoints?: number[];
  /** Index into snapPoints used each time the sheet opens. */
  defaultSnap?: number;
  onSnapChange?: (index: number) => void;
  accent?: string;
  className?: string;
}

/**
 * A modal sheet that slides up from the bottom. Drag the top bar between heights, fling it down to
 * close, or use the keyboard: the handle is a button that Arrow Up / Down resize, and Escape closes.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  onSnapChange,
  accent = "#a78bfa",
  className = "",
}: BottomSheetProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  // Keep the native dialog in step with the open prop, and give focus back to whatever opened it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
      returnTo.current?.focus();
    }
  }, [open]);

  // A modal dialog doesn't stop the page behind it from scrolling, so lock it while open.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const close = () => onOpenChange(false);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // The dialog fills the screen and the sheet sits at its bottom, so a click that lands on the
      // dialog itself is a click on the dimmed area above the sheet.
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{ "--bs-accent": accent } as CSSProperties}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-zinc-100 backdrop:bg-black/60"
    >
      {/* Mounted only while open, so every opening starts fresh at defaultSnap. */}
      {open && (
        <Sheet
          id={id}
          title={title}
          description={description}
          footer={footer}
          snapPoints={snapPoints}
          defaultSnap={defaultSnap}
          onSnapChange={onSnapChange}
          onClose={close}
          className={className}
        >
          {children}
        </Sheet>
      )}
    </dialog>
  );
}

interface SheetProps {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  snapPoints: number[];
  defaultSnap: number;
  onSnapChange?: (index: number) => void;
  onClose: () => void;
  className: string;
}

/** Fling speed, in px per ms, that counts as a flick rather than a slow drag. */
const FLING = 0.5;

function Sheet({
  id,
  title,
  description,
  children,
  footer,
  snapPoints,
  defaultSnap,
  onSnapChange,
  onClose,
  className,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number } | null>(null);
  const last = snapPoints.length - 1;
  const [snap, setSnap] = useState(() => Math.min(Math.max(defaultSnap, 0), last));
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");

  const goTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), last);
    setSnap(next);
    setAnnounce(`Sheet height ${Math.round(snapPoints[next] * 100)}%`);
    onSnapChange?.(next);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Buttons in the header (like Close) keep working as buttons.
    if ((e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("[data-handle]")) return;
    const height = panelRef.current?.getBoundingClientRect().height ?? 0;
    drag.current = { startY: e.clientY, startH: height, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    if (dragHeight === null) {
      if (Math.abs(e.clientY - d.startY) < 4) return;
      // Capture only once it's really a drag. Capturing on press would send the click to this bar
      // instead of the handle button, and a tap on the handle would do nothing.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    const max = snapPoints[last] * window.innerHeight;
    let h = d.startH - (e.clientY - d.startY);
    // Past the tallest point the sheet resists, so it's clear it can't go further.
    if (h > max) h = max + (h - max) * 0.15;
    setDragHeight(Math.max(0, h));
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || dragHeight === null) return;
    setDragHeight(null);
    const fraction = dragHeight / window.innerHeight;
    if (d.v > FLING) {
      // Flicked down: drop to the next lower point, or close from the lowest.
      const lower = snapPoints.findLastIndex((p) => p < fraction - 0.02);
      if (lower === -1) onClose();
      else goTo(lower);
      return;
    }
    if (d.v < -FLING) {
      const higher = snapPoints.findIndex((p) => p > fraction + 0.02);
      goTo(higher === -1 ? last : higher);
      return;
    }
    // Slow release: settle on the nearest point, unless it was pulled well below the lowest one.
    if (fraction < snapPoints[0] * 0.6) {
      onClose();
      return;
    }
    let nearest = 0;
    snapPoints.forEach((p, i) => {
      if (Math.abs(p - fraction) < Math.abs(snapPoints[nearest] - fraction)) nearest = i;
    });
    goTo(nearest);
  };

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowUp: snap + 1, ArrowDown: snap - 1, Home: 0, End: last };
    if (!(e.key in keys)) return;
    e.preventDefault();
    goTo(keys[e.key]);
  };

  const resizable = snapPoints.length > 1;
  const height = dragHeight !== null ? `${dragHeight}px` : `${snapPoints[snap] * 100}dvh`;

  return (
    <div
      ref={panelRef}
      style={{ height }}
      className={[
        "absolute inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col overflow-hidden rounded-t-3xl border border-b-0 border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50",
        "starting:translate-y-full",
        dragHeight === null ? "transition-[height,translate] duration-300 ease-out motion-reduce:transition-none" : "",
        className,
      ].join(" ")}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setDragHeight(null);
        }}
        className="shrink-0 cursor-grab touch-none select-none px-5 pb-3 pt-2 active:cursor-grabbing"
      >
        {resizable ? (
          <button
            type="button"
            data-handle
            onClick={() => goTo(snap < last ? last : 0)}
            onKeyDown={onHandleKey}
            aria-label={`Resize sheet, ${Math.round(snapPoints[snap] * 100)}% of the screen`}
            aria-describedby={`${id}-hint`}
            aria-keyshortcuts="ArrowUp ArrowDown"
            className="mx-auto flex h-6 w-16 cursor-[inherit] items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bs-accent)]"
          >
            <span className="h-1.5 w-10 rounded-full bg-zinc-600" aria-hidden="true" />
          </button>
        ) : (
          <div className="mx-auto flex h-6 w-16 items-center justify-center" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-zinc-600" />
          </div>
        )}
        <span id={`${id}-hint`} className="sr-only">
          Drag, press Enter, or use the up and down arrows to change the height.
        </span>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-semibold text-zinc-50">
              {title}
            </h2>
            {description && (
              <p id={`${id}-desc`} className="mt-0.5 text-sm text-zinc-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bs-accent)]"
          >
            <span className="sr-only">Close</span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-zinc-800 px-5 py-4">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {footer}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

export default BottomSheet;
