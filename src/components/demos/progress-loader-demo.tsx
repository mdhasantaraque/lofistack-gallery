"use client";

import { useEffect, useState } from "react";
import { ProgressLoader, type LoaderStage, type LoaderStatus } from "@/components/ui/progress-loader";

const stages: LoaderStage[] = [
  { id: "upload", label: "Uploading files", detail: "142 files, 18.4 MB" },
  { id: "install", label: "Installing dependencies", detail: "Restoring cache, then 3 new packages" },
  { id: "build", label: "Building", detail: "Can't be measured, so the bar moves instead" },
  { id: "optimize", label: "Optimizing images", detail: "24 images to WebP" },
  { id: "live", label: "Going live", detail: "Switching traffic to the new version" },
];

// Progress per 200 ms tick for each stage. Uneven on purpose, like a real pipeline.
const speed = [0.06, 0.035, 0.05, 0.08, 0.2];
const BUILD = 2;

interface Run {
  key: number;
  current: number;
  progress: number;
  status: LoaderStatus;
}

export default function ProgressLoaderDemo() {
  const [run, setRun] = useState<Run>({ key: 0, current: 0, progress: 0, status: "idle" });
  const [failBuild, setFailBuild] = useState(true);

  useEffect(() => {
    if (run.status !== "running") return;
    const timer = window.setInterval(() => {
      setRun((r) => {
        if (r.status !== "running") return r;
        const progress = r.progress + speed[r.current] * (0.6 + Math.random() * 0.8);
        if (r.current === BUILD && failBuild && progress > 0.55) return { ...r, progress, status: "error" };
        if (progress < 1) return { ...r, progress };
        if (r.current === stages.length - 1) return { ...r, progress: 1, status: "done" };
        return { ...r, current: r.current + 1, progress: 0 };
      });
    }, 200);
    return () => clearInterval(timer);
  }, [run.status, failBuild]);

  const start = () => setRun((r) => ({ key: r.key + 1, current: 0, progress: 0, status: "running" }));

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={start}
            className="h-9 rounded-lg bg-sky-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            {run.status === "idle" ? "Start deploy" : "Restart deploy"}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={failBuild}
              onChange={(e) => setFailBuild(e.target.checked)}
              className="size-4 accent-sky-400"
            />
            Fail during build
          </label>
        </div>

        <ProgressLoader
          // A new key per run resets the time-left estimate.
          key={run.key}
          title="Deploying lofistack-gallery"
          stages={stages}
          current={run.current}
          progress={run.current === BUILD && run.status !== "error" ? null : run.progress}
          status={run.status}
          errorMessage="Build failed: Type error in src/app/page.tsx (line 12). Fix it and retry, earlier steps are kept."
          onPause={() => setRun((r) => ({ ...r, status: "paused" }))}
          onResume={() => setRun((r) => ({ ...r, status: "running" }))}
          onCancel={() => setRun((r) => ({ key: r.key + 1, current: 0, progress: 0, status: "idle" }))}
          onRetry={() => {
            setFailBuild(false);
            setRun((r) => ({ ...r, progress: 0, status: "running" }));
          }}
        />
      </div>
    </div>
  );
}
