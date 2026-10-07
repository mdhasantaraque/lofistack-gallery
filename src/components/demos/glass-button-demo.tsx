"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M10 1.5 11.9 7l5.6 1.1-4.3 3.6 1.2 5.8L10 14.6l-4.4 2.9 1.2-5.8L2.5 8.1 8.1 7 10 1.5Z" />
    </svg>
  );
}

export default function GlassButtonDemo() {
  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState(0);

  const simulateSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setClicks((c) => c + 1);
    }, 1600);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl px-4 py-10 sm:px-10 sm:py-14"
      style={{
        background:
          "radial-gradient(circle at 18% 22%, #7c3aed 0, transparent 42%), radial-gradient(circle at 82% 28%, #0ea5e9 0, transparent 40%), radial-gradient(circle at 50% 95%, #db2777 0, transparent 48%), #140c2b",
      }}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <GlassButton size="sm">Small</GlassButton>
          <GlassButton>Medium</GlassButton>
          <GlassButton size="lg" rightIcon={<ArrowIcon />}>
            Large
          </GlassButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <GlassButton variant="frosted" leftIcon={<SparkIcon />}>
            Frosted
          </GlassButton>
          <GlassButton variant="frosted" tint="#38bdf8">
            Sky tint
          </GlassButton>
          <GlassButton variant="frosted" tint="#f472b6">
            Pink tint
          </GlassButton>
          <GlassButton disabled>Disabled</GlassButton>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <GlassButton
            variant="frosted"
            tint="#a78bfa"
            size="lg"
            fullWidth
            loading={loading}
            loadingText="Saving…"
            onClick={simulateSave}
          >
            Save changes
          </GlassButton>
          <p className="text-sm text-white/80" aria-live="polite">
            {clicks === 0 ? "Click to see the loading state." : `Saved ${clicks} time${clicks > 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
