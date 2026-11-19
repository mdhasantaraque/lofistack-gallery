"use client";

import { useRef, useState } from "react";
import { UploadQueue, type UploadFn } from "@/components/ui/upload-queue";

/**
 * Fake upload that behaves like a real one: speed varies, it honours the abort signal,
 * and any file with "fail" in its name breaks at 60%.
 */
const fakeUpload: UploadFn = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const bytesPerTick = 60_000 + Math.random() * 140_000;
    let sent = 0;
    const timer = window.setInterval(() => {
      sent = Math.min(sent + bytesPerTick, file.size);
      const fraction = sent / file.size;
      onProgress(fraction);
      if (file.name.includes("fail") && fraction >= 0.6) {
        clearInterval(timer);
        reject(new Error("Connection reset at 60%. Retry to resume."));
      } else if (fraction >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, 150);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(new DOMException("Canceled", "AbortError"));
    });
  });

/** Builds placeholder files of a given size so the demo works without picking real ones. */
const sample = (name: string, sizeKb: number, type: string) =>
  new File([new Uint8Array(sizeKb * 1024)], name, { type });

export default function UploadQueueDemo() {
  const [log, setLog] = useState("Drop some files, or add the samples.");
  const addRef = useRef<HTMLDivElement>(null);

  const addSamples = () => {
    const files = [
      sample("hero-banner.png", 2400, "image/png"),
      sample("product-shot.jpg", 1200, "image/jpeg"),
      sample("brand-guide.pdf", 3600, "application/pdf"),
      sample("upload-will-fail.png", 1800, "image/png"),
      sample("raw-footage.mov", 14000, "video/quicktime"),
      sample("notes.exe", 200, "application/x-msdownload"),
    ];
    // Hand the files to the queue's own input, exactly like a user picking them.
    const input = addRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div ref={addRef} className="mx-auto max-w-xl">
        <UploadQueue
          upload={fakeUpload}
          accept="image/*,application/pdf,video/*"
          maxSize={10 * 1024 * 1024}
          concurrency={2}
          label="Upload assets"
          onComplete={(done) => setLog(`onComplete: ${done.length} file${done.length === 1 ? "" : "s"} uploaded`)}
        />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={addSamples}
            className="h-9 rounded-lg border border-zinc-700 px-3 text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            Add 6 sample files
          </button>
          <span className="text-zinc-500" aria-live="polite">
            {log}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Samples include a file that fails at 60%, one over the 10 MB limit and one blocked file type.
        </p>
      </div>
    </div>
  );
}
