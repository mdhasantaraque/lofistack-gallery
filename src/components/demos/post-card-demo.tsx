"use client";

import { useState } from "react";
import { PostCard } from "@/components/ui/post-card";

const longText = `Week 9 of the #LofiStack 90 day build is done. 26 components so far, each with its own page, demo and source.

Biggest lesson this week: test the edges, not just the happy path. Two of my bugs only showed up when today's date was before the minimum date, and when a popup sat near the right edge of the screen.

Thanks @ayesha for the review and @tanvir for testing on a real phone. Gallery: https://lofistack-gallery-three.vercel.app`;

export default function PostCardDemo() {
  const [failLikes, setFailLikes] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const note = (e: string) => setEvents((l) => [e, ...l].slice(0, 4));

  const server = async (what: string) => {
    await new Promise((r) => setTimeout(r, 600));
    if (failLikes && what.startsWith("like")) throw new Error("offline");
    note(`server: ${what}`);
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <PostCard
          author={{ name: "Md. Hasan Taraque", handle: "taraque", color: "#a78bfa", verified: true }}
          date="2026-11-20"
          text={longText}
          counts={{ likes: 1284, reposts: 96, comments: 42 }}
          onLike={(liked) => server(liked ? "like" : "like removed")}
          onRepost={(r) => server(r ? "reposted" : "repost removed")}
          onBookmark={(b) => server(b ? "bookmarked" : "bookmark removed")}
          onComment={() => note("comment box opened")}
          shareUrl="https://lofistack-gallery-three.vercel.app/components/post-card"
          media={
            <div className="grid aspect-[16/7] place-items-center bg-gradient-to-br from-violet-600/60 via-sky-600/40 to-emerald-500/40">
              <span className="text-3xl font-bold tracking-tight text-white/90">26 / 30</span>
            </div>
          }
        />
        <PostCard
          author={{ name: "Ayesha Rahman", handle: "ayesha", color: "#f472b6" }}
          date="2026-11-19"
          text="Short posts don't get a Show more button. #design"
          counts={{ likes: 18, reposts: 2, comments: 3 }}
          defaultLiked
          onLike={(liked) => server(liked ? "like" : "like removed")}
        />
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
          <ul className="min-h-12 space-y-0.5 text-xs text-zinc-500" aria-label="Events">
            {events.length ? events.map((e, i) => <li key={i}>{e}</li>) : <li>Like, repost, bookmark or share.</li>}
          </ul>
          <label className="inline-flex cursor-pointer items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={failLikes}
              onChange={(e) => setFailLikes(e.target.checked)}
              className="size-4 accent-pink-400"
            />
            Make likes fail (rolls back)
          </label>
        </div>
      </div>
    </div>
  );
}
