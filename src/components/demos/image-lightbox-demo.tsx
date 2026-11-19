"use client";

import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";

/** Draws a simple layered landscape as an SVG data URL, so the demo needs no image files. */
function scene(sky: [string, string], hills: [string, string, string], sun: string, sunY: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect width="1200" height="800" fill="url(#s)"/>
    <circle cx="820" cy="${sunY}" r="90" fill="${sun}" opacity="0.9"/>
    <path d="M0 520 Q200 380 420 500 T860 460 T1200 500 V800 H0Z" fill="${hills[0]}"/>
    <path d="M0 610 Q260 500 520 600 T1000 570 T1200 600 V800 H0Z" fill="${hills[1]}"/>
    <path d="M0 700 Q300 640 600 700 T1200 690 V800 H0Z" fill="${hills[2]}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const images: LightboxImage[] = [
  {
    src: scene(["#1e1b4b", "#f472b6"], ["#4c1d95", "#2e1065", "#1e1b4b"], "#fde68a", 360),
    alt: "Pink dusk over violet hills",
    caption: "Dusk, Sajek Valley",
  },
  {
    src: scene(["#0c4a6e", "#7dd3fc"], ["#155e75", "#164e63", "#083344"], "#fef9c3", 200),
    alt: "Bright morning sky over teal hills",
    caption: "Morning, Srimangal tea gardens",
  },
  {
    src: scene(["#7c2d12", "#fdba74"], ["#9a3412", "#7c2d12", "#431407"], "#fff7ed", 420),
    alt: "Orange sunset behind rust-colored hills",
    caption: "Sunset, Bandarban",
  },
  {
    src: scene(["#022c22", "#34d399"], ["#065f46", "#064e3b", "#022c22"], "#ecfccb", 260),
    alt: "Green sky glow over deep green hills",
    caption: "After rain, Sylhet",
  },
  {
    src: scene(["#020617", "#334155"], ["#1e293b", "#0f172a", "#020617"], "#e2e8f0", 180),
    alt: "Moon over dark blue night hills",
    caption: "Night, Nilgiri",
  },
  {
    src: scene(["#4a044e", "#fb7185"], ["#701a75", "#4a044e", "#2e0330"], "#ffe4e6", 340),
    alt: "Rose sky over plum hills",
    caption: "Last light, Rangamati",
  },
];

export default function ImageLightboxDemo() {
  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <ImageLightbox label="Hill country photos" images={images} columns={3} />
      <p className="mt-4 text-xs text-zinc-500">
        Open an image, then use ← → or swipe, click or press Z to zoom and drag to pan, Escape to close.
      </p>
    </div>
  );
}
