"use client";

import { Fragment, useState } from "react";
import { MentionComposer, type ComposerPayload, type MentionUser } from "@/components/ui/mention-composer";

const users: MentionUser[] = [
  { id: "1", name: "Ayesha Rahman", handle: "ayesha", role: "Design lead", color: "#f472b6" },
  { id: "2", name: "Tanvir Ahmed", handle: "tanvir", role: "Frontend", color: "#38bdf8" },
  { id: "3", name: "Nadia Islam", handle: "nadia.i", role: "Product", color: "#34d399" },
  { id: "4", name: "Rafi Chowdhury", handle: "rafi", role: "Backend", color: "#fbbf24" },
  { id: "5", name: "Sara Khan", handle: "sarak", role: "QA", color: "#a78bfa" },
  { id: "6", name: "Imran Haque", handle: "imran", role: "DevOps", color: "#fb923c" },
  { id: "7", name: "Mina Novak", handle: "mina", role: "Content", color: "#2dd4bf" },
  { id: "8", name: "Karim Silva", handle: "karim_s", role: "Support", color: "#f87171" },
];

const byHandle = new Map(users.map((u) => [u.handle, u]));

interface Comment {
  id: number;
  text: string;
  mentions: MentionUser[];
}

/** Renders saved text with known @handles as pills. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(@[a-z0-9_.]+)/gi);
  return (
    <>
      {parts.map((part, i) => {
        const user = i % 2 === 1 ? byHandle.get(part.slice(1).toLowerCase()) : undefined;
        return user ? (
          <span key={i} className="rounded bg-violet-500/20 px-1 font-medium text-violet-200" title={user.name}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

export default function MentionComposerDemo() {
  const [comments, setComments] = useState<Comment[]>([
    { id: 0, text: "Pushed the new pricing cards, can @ayesha check the spacing on mobile?", mentions: [users[0]] },
  ]);
  const [failNext, setFailNext] = useState(false);

  const post = async ({ text, mentions }: ComposerPayload) => {
    const shouldFail = failNext;
    await new Promise((r) => setTimeout(r, 700));
    if (shouldFail) {
      setFailNext(false);
      throw new Error("You're offline. Your comment is still in the box, so nothing is lost.");
    }
    setComments((c) => [...c, { id: Date.now(), text, mentions }]);
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-xl">
        <ul className="mb-6 space-y-4" aria-label="Comments">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200"
              >
                HT
              </span>
              <div className="min-w-0">
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-zinc-100">Hasan</span>
                </p>
                <p className="mt-0.5 break-words text-sm leading-relaxed text-zinc-300">
                  <RichText text={c.text} />
                </p>
                {c.mentions.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">Notified {c.mentions.map((m) => m.name).join(", ")}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <MentionComposer users={users} label="Add a comment" maxLength={200} onSubmit={post} />

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            className="size-4 accent-violet-400"
          />
          Make the next post fail (shows the error state)
        </label>
      </div>
    </div>
  );
}
