"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export interface LightboxImage {
  src: string;
  /** Required: describes the image for people who can't see it. */
  alt: string;
  caption?: string;
  /** Smaller file for the grid and the strip. Defaults to src. */
  thumbSrc?: string;
}

export interface ImageLightboxProps {
  images: LightboxImage[];
  /** Accessible name of the gallery. */
  label: string;
  columns?: 2 | 3 | 4;
  /** Wrap from the last image to the first. */
  loop?: boolean;
  /** How far zoom magnifies. */
  zoomScale?: number;
  accent?: string;
  className?: string;
}

const COLS = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" };

export function ImageLightbox({
  images,
  label,
  columns = 3,
  loop = true,
  zoomScale = 2,
  accent = "#a78bfa",
  className = "",
}: ImageLightboxProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const open = index !== null;
  const count = images.length;
  const current = index !== null ? images[index] : null;

  // Keep the native dialog in step with state. When it closes, put focus back on the thumbnail
  // that opened it, so keyboard users don't lose their place in the grid.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      if (lastOpened.current !== null) thumbs.current[lastOpened.current]?.focus();
    }
  }, [open]);

  const show = (i: number) => {
    lastOpened.current = i;
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setIndex(i);
  };

  const go = (step: number) => {
    if (index === null) return;
    let next = index + step;
    if (loop) next = (next + count) % count;
    if (next < 0 || next >= count) return;
    lastOpened.current = next;
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setIndex(next);
  };

  const close = () => setIndex(null);

  const toggleZoom = () => {
    setZoomed((z) => !z);
    setPan({ x: 0, y: 0 });
  };

  const onKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => go(1),
      ArrowLeft: () => go(-1),
      Home: () => index !== null && show(0),
      End: () => index !== null && show(count - 1),
      z: toggleZoom,
      "+": () => !zoomed && toggleZoom(),
      "-": () => zoomed && toggleZoom(),
    };
    const fn = keys[e.key];
    if (!fn) return;
    // Let arrow keys work normally inside the thumbnail strip buttons too.
    e.preventDefault();
    fn();
  };

  // Pointer: drag pans when zoomed, a horizontal swipe changes image when not, a tap toggles zoom.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, moved: false };
    // Capture keeps the drag going outside the image. It can fail for a pointer that's already gone,
    // and the gesture should still work without it.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const limitX = (rect.width * (zoomScale - 1)) / 2 / zoomScale;
      const limitY = (rect.height * (zoomScale - 1)) / 2 / zoomScale;
      setPan({
        x: Math.max(-limitX, Math.min(limitX, d.panX + dx / zoomScale)),
        y: Math.max(-limitY, Math.min(limitY, d.panY + dy / zoomScale)),
      });
    }
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) toggleZoom();
    else if (!zoomed && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const iconBtn =
    "grid size-10 place-items-center rounded-full bg-zinc-900/80 text-zinc-100 backdrop-blur transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lb-accent)] disabled:opacity-30";
  const atStart = !loop && index === 0;
  const atEnd = !loop && index === count - 1;

  return (
    <div style={{ "--lb-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      <ul className={`grid gap-2 sm:gap-3 ${COLS[columns]}`} role="list" aria-label={label}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              aria-label={`Open image ${i + 1} of ${count}: ${img.alt}`}
              aria-haspopup="dialog"
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lb-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- any src, including data: URLs, without image config */}
              <img
                src={img.thumbSrc ?? img.src}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
              <span
                className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-counter`}
        aria-describedby={current?.caption ? `${id}-caption` : undefined}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onKeyDown={onKey}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-zinc-950/95 p-0 text-zinc-100 backdrop:bg-black/80"
      >
        {current && index !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p id={`${id}-counter`} className="text-sm tabular-nums text-zinc-300">
                <span className="sr-only">Image </span>
                {index + 1} / {count}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleZoom}
                  aria-pressed={zoomed}
                  aria-keyshortcuts="Z"
                  className={iconBtn}
                >
                  <span className="sr-only">{zoomed ? "Zoom out" : "Zoom in"}</span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="size-5"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="9" r="5.5" />
                    <path d="m13 13 4 4M6.5 9h5" strokeLinecap="round" />
                    {!zoomed && <path d="M9 6.5v5" strokeLinecap="round" />}
                  </svg>
                </button>
                <button type="button" onClick={close} className={iconBtn}>
                  <span className="sr-only">Close</span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="size-5"
                    aria-hidden="true"
                  >
                    <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <div
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={() => (drag.current = null)}
                className={[
                  "absolute inset-0 touch-none select-none overflow-hidden",
                  zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                <img
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  draggable={false}
                  className="size-full object-contain transition-transform duration-200 ease-out motion-reduce:transition-none"
                  style={{ transform: zoomed ? `scale(${zoomScale}) translate(${pan.x}px, ${pan.y}px)` : undefined }}
                />
              </div>
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={atStart}
                aria-label="Previous image"
                className={`${iconBtn} absolute left-3 top-1/2 -translate-y-1/2`}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={atEnd}
                aria-label="Next image"
                className={`${iconBtn} absolute right-3 top-1/2 -translate-y-1/2`}
              >
                ›
              </button>
              {/* Warm the cache for the neighbours so next/previous feel instant. */}
              <div hidden>
                {[index - 1, index + 1].map((n) => {
                  const img = images[(n + count) % count];
                  return img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- preload only
                    <img key={`pre-${n}`} src={img.src} alt="" />
                  ) : null;
                })}
              </div>
            </div>

            <div className="px-4 pb-4 pt-3">
              <p id={`${id}-caption`} className="min-h-5 text-center text-sm text-zinc-300" aria-live="polite">
                {current.caption ?? current.alt}
              </p>
              <ul
                className="mx-auto mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 sm:justify-center"
                role="list"
                aria-label="All images"
              >
                {images.map((img, i) => (
                  <li key={img.src} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => show(i)}
                      aria-label={`Image ${i + 1}: ${img.alt}`}
                      aria-current={i === index || undefined}
                      className={[
                        "block h-12 w-16 overflow-hidden rounded-md ring-2 transition focus-visible:outline-none focus-visible:ring-[var(--lb-accent)]",
                        i === index
                          ? "opacity-100 ring-[var(--lb-accent)]"
                          : "opacity-50 ring-transparent hover:opacity-80",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                      <img src={img.thumbSrc ?? img.src} alt="" className="size-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

export default ImageLightbox;
