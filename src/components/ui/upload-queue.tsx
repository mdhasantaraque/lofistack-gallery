"use client";

import { useId, useRef, useState, type CSSProperties, type DragEvent } from "react";

export interface UploadContext {
  /** Report progress from 0 to 1. */
  onProgress: (fraction: number) => void;
  /** Aborted when the user cancels. Pass it to fetch() or XHR. */
  signal: AbortSignal;
}

export type UploadFn = (file: File, ctx: UploadContext) => Promise<void>;

export type UploadStatus = "queued" | "uploading" | "done" | "error" | "canceled";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  /** Bytes per second, measured while uploading. */
  speed: number;
  error?: string;
}

export interface UploadQueueProps {
  /** Does the real upload. The queue handles order, limits, progress, cancel and retry. */
  upload: UploadFn;
  /** Same format as the input accept attribute, e.g. "image/*,.pdf". */
  accept?: string;
  /** Max bytes per file. */
  maxSize?: number;
  maxFiles?: number;
  /** How many files upload at the same time. */
  concurrency?: number;
  /** Fires every time the queue goes idle with at least one finished file. */
  onComplete?: (done: UploadItem[]) => void;
  label?: string;
  accent?: string;
  className?: string;
}

const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`;

const formatEta = (s: number) => (s < 1 ? "<1s" : s < 60 ? `${Math.ceil(s)}s` : `${Math.ceil(s / 60)} min`);

function accepts(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
    return file.type === r;
  });
}

function FileIcon({ type }: { type: string }) {
  const label = type.startsWith("image/")
    ? "IMG"
    : type === "application/pdf"
      ? "PDF"
      : type.startsWith("video/")
        ? "VID"
        : "FILE";
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400"
    >
      {label}
    </span>
  );
}

export function UploadQueue({
  upload,
  accept,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 20,
  concurrency = 2,
  onComplete,
  label = "Upload files",
  accent = "#38bdf8",
  className = "",
}: UploadQueueProps) {
  const id = useId();
  // The ref is the source of truth so async callbacks always see the latest list.
  // `items` is a copy for rendering, refreshed by commit().
  const itemsRef = useRef<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const commit = () => setItems([...itemsRef.current]);
  const patch = (itemId: string, change: Partial<UploadItem>) => {
    itemsRef.current = itemsRef.current.map((it) => (it.id === itemId ? { ...it, ...change } : it));
    commit();
  };

  /** Starts queued files until `concurrency` are running. Called after every change. */
  const pump = () => {
    const running = itemsRef.current.filter((it) => it.status === "uploading").length;
    const next = itemsRef.current.filter((it) => it.status === "queued").slice(0, Math.max(concurrency - running, 0));
    for (const item of next) start(item);
    const busy = itemsRef.current.some((it) => it.status === "uploading" || it.status === "queued");
    const done = itemsRef.current.filter((it) => it.status === "done");
    if (!busy && next.length === 0 && done.length) onComplete?.(done);
  };

  const start = (item: UploadItem) => {
    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    let startedAt: number | null = null;
    patch(item.id, { status: "uploading", progress: 0, speed: 0, error: undefined });
    upload(item.file, {
      signal: controller.signal,
      onProgress: (fraction) => {
        if (controller.signal.aborted) return;
        startedAt ??= performance.now();
        const seconds = (performance.now() - startedAt) / 1000;
        const progress = Math.min(Math.max(fraction, 0), 1);
        patch(item.id, { progress, speed: seconds > 0.2 ? (progress * item.file.size) / seconds : 0 });
      },
    })
      .then(() => {
        if (!controller.signal.aborted) patch(item.id, { status: "done", progress: 1 });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        patch(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
      })
      .finally(() => {
        controllers.current.delete(item.id);
        pump();
      });
  };

  const addFiles = (list: FileList | File[]) => {
    const files = [...list];
    const room = maxFiles - itemsRef.current.filter((it) => it.status !== "canceled").length;
    const accepted = files.slice(0, Math.max(room, 0));
    const skipped = files.length - accepted.length;
    setNotice(
      skipped > 0
        ? `${skipped} file${skipped === 1 ? " was" : "s were"} skipped: the limit is ${maxFiles} files.`
        : null,
    );

    const fresh: UploadItem[] = accepted.map((file) => {
      const base = {
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        progress: 0,
        speed: 0,
      };
      if (!accepts(file, accept)) return { ...base, status: "error", error: "This file type isn't allowed" };
      if (file.size > maxSize)
        return { ...base, status: "error", error: `Too large. The limit is ${formatBytes(maxSize)}` };
      return { ...base, status: "queued" };
    });
    itemsRef.current = [...itemsRef.current, ...fresh];
    commit();
    pump();
  };

  const cancel = (itemId: string) => {
    controllers.current.get(itemId)?.abort();
    patch(itemId, { status: "canceled" });
    pump();
  };

  const retry = (itemId: string) => {
    patch(itemId, { status: "queued", progress: 0, error: undefined });
    pump();
  };

  const remove = (itemId: string) => {
    controllers.current.get(itemId)?.abort();
    itemsRef.current = itemsRef.current.filter((it) => it.id !== itemId);
    commit();
    pump();
  };

  const clearFinished = () => {
    itemsRef.current = itemsRef.current.filter((it) => it.status === "uploading" || it.status === "queued");
    commit();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // Overall progress counts bytes, so one big file weighs more than many small ones.
  const counted = items.filter((it) => it.status !== "canceled" && !(it.status === "error" && it.progress === 0));
  const totalBytes = counted.reduce((n, it) => n + it.file.size, 0);
  const sentBytes = counted.reduce((n, it) => n + it.file.size * it.progress, 0);
  const overall = totalBytes ? sentBytes / totalBytes : 0;
  const active = items.filter((it) => it.status === "uploading" || it.status === "queued").length;
  const doneCount = items.filter((it) => it.status === "done").length;
  const failed = items.filter((it) => it.status === "error").length;
  const speed = items.filter((it) => it.status === "uploading").reduce((n, it) => n + it.speed, 0);
  const remainingBytes = items
    .filter((it) => it.status === "uploading" || it.status === "queued")
    .reduce((n, it) => n + it.file.size * (1 - it.progress), 0);

  const smallButton =
    "rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uq-accent)]";

  return (
    <div style={{ "--uq-accent": accent } as CSSProperties} className={["w-full", className].join(" ")}>
      <label
        htmlFor={`${id}-input`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={onDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "focus-within:ring-2 focus-within:ring-[var(--uq-accent)] focus-within:ring-offset-2 focus-within:ring-offset-zinc-950",
          dragging
            ? "border-[var(--uq-accent)] bg-[color-mix(in_oklab,var(--uq-accent)_10%,transparent)]"
            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-8 text-zinc-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-medium text-zinc-100">{dragging ? "Drop to upload" : label}</span>
        <span className="text-xs text-zinc-500">
          Drag files here or <span className="text-[var(--uq-accent)] underline underline-offset-2">browse</span>
          {" · "}up to {formatBytes(maxSize)} each
        </span>
        <input
          id={`${id}-input`}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {notice && (
        <p role="alert" className="mt-3 text-sm text-amber-300">
          {notice}
        </p>
      )}

      {items.length > 0 && (
        <section aria-labelledby={`${id}-summary`} className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id={`${id}-summary`} className="text-sm text-zinc-300" aria-live="polite">
              {active > 0
                ? `Uploading ${active} file${active === 1 ? "" : "s"}`
                : `${doneCount} uploaded${failed ? `, ${failed} failed` : ""}`}
              {active > 0 && speed > 0 && (
                <span className="text-zinc-500">
                  {" "}
                  · {formatBytes(speed)}/s · {formatEta(remainingBytes / speed)} left
                </span>
              )}
            </p>
            {active === 0 && (
              <button type="button" onClick={clearFinished} className={smallButton}>
                Clear list
              </button>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Overall upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(overall * 100)}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-[var(--uq-accent)] transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${overall * 100}%` }}
            />
          </div>

          <ul className="mt-4 space-y-2" role="list">
            {items.map((it) => {
              const eta = it.speed > 0 ? ((1 - it.progress) * it.file.size) / it.speed : null;
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <FileIcon type={it.file.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm text-zinc-100" title={it.file.name}>
                        {it.file.name}
                      </p>
                      <p className="shrink-0 text-xs tabular-nums text-zinc-500">
                        {it.status === "uploading"
                          ? `${Math.round(it.progress * 100)}%${eta !== null ? ` · ${formatEta(eta)}` : ""}`
                          : formatBytes(it.file.size)}
                      </p>
                    </div>
                    {it.status === "uploading" || it.status === "queued" ? (
                      <div
                        role="progressbar"
                        aria-label={`${it.file.name} upload`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(it.progress * 100)}
                        aria-valuetext={it.status === "queued" ? "Waiting" : `${Math.round(it.progress * 100)}%`}
                        className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800"
                      >
                        <div
                          className="h-full rounded-full bg-[var(--uq-accent)] transition-[width] duration-200 motion-reduce:transition-none"
                          style={{ width: `${it.progress * 100}%` }}
                        />
                      </div>
                    ) : (
                      <p
                        className={[
                          "mt-1 text-xs",
                          it.status === "done"
                            ? "text-emerald-300"
                            : it.status === "error"
                              ? "text-red-300"
                              : "text-zinc-500",
                        ].join(" ")}
                      >
                        {it.status === "done" ? "✓ Uploaded" : it.status === "error" ? it.error : "Canceled"}
                      </p>
                    )}
                    {it.status === "queued" && <p className="mt-1 text-xs text-zinc-500">Waiting…</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {(it.status === "uploading" || it.status === "queued") && (
                      <button type="button" onClick={() => cancel(it.id)} className={smallButton}>
                        Cancel<span className="sr-only"> {it.file.name}</span>
                      </button>
                    )}
                    {(it.status === "error" || it.status === "canceled") &&
                      accepts(it.file, accept) &&
                      it.file.size <= maxSize && (
                        <button type="button" onClick={() => retry(it.id)} className={smallButton}>
                          Retry<span className="sr-only"> {it.file.name}</span>
                        </button>
                      )}
                    {it.status !== "uploading" && it.status !== "queued" && (
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className={smallButton}
                        aria-label={`Remove ${it.file.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export default UploadQueue;
