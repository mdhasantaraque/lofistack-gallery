"use client";

import { useState, type MouseEvent } from "react";
import { MegaMenuNavbar, type MegaItem } from "@/components/ui/mega-menu-navbar";

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
    <path fillRule="evenodd" d={d} clipRule="evenodd" />
  </svg>
);

const I = {
  bolt: icon("M11 1 3 11h6l-1 8 8-10h-6l1-8Z"),
  chart: icon("M3 17h14v1H3v-1Zm1-6h2v5H4v-5Zm4-4h2v9H8V7Zm4 2h2v7h-2V9Zm4-6h2v13h-2V3Z"),
  lock: icon(
    "M6 8V6a4 4 0 1 1 8 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1Zm2 0h4V6a2 2 0 1 0-4 0v2Z",
  ),
  globe: icon(
    "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm5.9 7h-2.4a12 12 0 0 0-1.1-4.6A6 6 0 0 1 15.9 9ZM10 4c.9 1.2 1.6 3 1.8 5H8.2c.2-2 .9-3.8 1.8-5ZM4.1 11h2.4a12 12 0 0 0 1.1 4.6A6 6 0 0 1 4.1 11Zm0-2a6 6 0 0 1 3.5-4.6A12 12 0 0 0 6.5 9H4.1Zm5.9 7c-.9-1.2-1.6-3-1.8-5h3.6c-.2 2-.9 3.8-1.8 5Zm2.4-.4a12 12 0 0 0 1.1-4.6h2.4a6 6 0 0 1-3.5 4.6Z",
  ),
  book: icon("M4 3h9a3 3 0 0 1 3 3v11H6a2 2 0 0 1-2-2V3Zm2 12h8v-1H6v1Z"),
  users: icon(
    "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 17a6 6 0 0 1 12 0H1Zm12 0a7.9 7.9 0 0 0-1.8-5A5 5 0 0 1 19 17h-6Z",
  ),
};

const items: MegaItem[] = [
  {
    id: "product",
    label: "Product",
    sections: [
      {
        title: "Build",
        links: [
          {
            label: "Deployments",
            href: "#deployments",
            description: "Push to deploy, with a preview for every branch.",
            icon: I.bolt,
          },
          {
            label: "Edge network",
            href: "#edge",
            description: "Serve from 90 cities, close to your users.",
            icon: I.globe,
          },
          {
            label: "Analytics",
            href: "#analytics",
            description: "Real visitor numbers, no cookie banner.",
            icon: I.chart,
            badge: "New",
          },
        ],
      },
      {
        title: "Secure",
        links: [
          {
            label: "Firewall",
            href: "#firewall",
            description: "Block bots and abuse before they reach you.",
            icon: I.lock,
          },
          {
            label: "Access control",
            href: "#access",
            description: "Password-protect previews and staging.",
            icon: I.users,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "What's new",
      title: "Analytics is here",
      description: "See which pages people actually read, without slowing your site down.",
      href: "#analytics",
      cta: "Read the launch post",
    },
  },
  {
    id: "resources",
    label: "Resources",
    sections: [
      {
        title: "Learn",
        links: [
          { label: "Docs", href: "#docs", description: "Guides and API reference.", icon: I.book },
          { label: "Templates", href: "#templates", description: "Start from 40+ ready projects.", icon: I.bolt },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Showcase", href: "#showcase", description: "Sites built by the community.", icon: I.globe },
          { label: "Discord", href: "#discord", description: "Ask questions, share what you made.", icon: I.users },
        ],
      },
    ],
  },
  { id: "pricing", label: "Pricing", href: "#pricing" },
  { id: "customers", label: "Customers", href: "#customers" },
];

export default function MegaMenuNavbarDemo() {
  const [last, setLast] = useState("Hover or Tab to Product, then press ↓.");

  // Keep demo links from jumping the page, and show which one was picked.
  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a || !a.getAttribute("href")?.startsWith("#")) return;
    e.preventDefault();
    setLast(`Clicked: ${a.getAttribute("href")}`);
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 p-2 sm:p-3" onClickCapture={onClickCapture}>
      <div className="relative min-h-[30rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <MegaMenuNavbar
          brand={
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-5 rounded-md bg-gradient-to-br from-indigo-400 to-sky-400" />
              Orbit
            </span>
          }
          items={items}
          actions={
            <div className="flex items-center gap-2">
              <a href="#login" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-zinc-50">
                Log in
              </a>
              <a
                href="#signup"
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
              >
                Sign up
              </a>
            </div>
          }
        />
        <div className="px-6 py-16 text-center">
          <p className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">Ship faster with Orbit</p>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">Page content sits here, under the panel.</p>
          <p className="mt-8 text-sm text-zinc-500" aria-live="polite">
            {last}
          </p>
        </div>
      </div>
    </div>
  );
}
