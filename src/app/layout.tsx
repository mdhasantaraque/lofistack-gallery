import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: `React, TypeScript and Tailwind components built by ${site.author} for the LofiStack 90 Day Build Challenge.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-zinc-950"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
            >
              <span aria-hidden="true" className="size-6 rounded-md bg-gradient-to-br from-violet-400 to-sky-400" />
              {site.name}
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/components" className="hover:text-zinc-100">
                Components
              </Link>
              <a href={site.repoUrl} className="hover:text-zinc-100" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-zinc-800/80">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-500 sm:px-6">
            Built by {site.author} · LofiStack 90 Day Build Challenge
          </div>
        </footer>
      </body>
    </html>
  );
}
