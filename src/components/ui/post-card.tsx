"use client";

import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface PostAuthor {
  name: string;
  handle: string;
  /** Any CSS color for the initials avatar. */
  color?: string;
  verified?: boolean;
}

export interface PostCardProps {
  author: PostAuthor;
  /** ISO date, e.g. "2026-11-18". Shown as a short date. */
  date: string;
  /** Plain text. #hashtags, @mentions and links become links. */
  text: string;
  media?: ReactNode;
  counts: { likes: number; reposts: number; comments: number };
  defaultLiked?: boolean;
  defaultReposted?: boolean;
  defaultBookmarked?: boolean;
  /** May return a promise. The UI updates at once and rolls back with a message if it rejects. */
  onLike?: (liked: boolean) => void | Promise<void>;
  onRepost?: (reposted: boolean) => void | Promise<void>;
  onBookmark?: (saved: boolean) => void | Promise<void>;
  onComment?: () => void;
  /** Link copied by Share, or passed to the system share sheet on phones. */
  shareUrl?: string;
  /** Lines shown before "Show more". */
  clampLines?: number;
  hrefForTag?: (tag: string) => string;
  hrefForMention?: (handle: string) => string;
  locale?: string;
  className?: string;
}

type Toggle = "like" | "repost" | "bookmark";

const compact = (n: number, locale: string) =>
  new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Splits text into plain parts and links for #tags, @mentions and URLs. */
function RichText({
  text,
  tagHref,
  mentionHref,
}: {
  text: string;
  tagHref: (t: string) => string;
  mentionHref: (h: string) => string;
}) {
  const parts = text.split(/(https?:\/\/[^\s]+|#[\p{L}\d_]+|@[\w.]+)/gu);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const href = part.startsWith("#")
          ? tagHref(part.slice(1))
          : part.startsWith("@")
            ? mentionHref(part.slice(1))
            : part;
        return (
          <a
            key={i}
            href={href}
            className="text-sky-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            {...(part.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          >
            {part.startsWith("http") ? part.replace(/^https?:\/\//, "").replace(/\/$/, "") : part}
          </a>
        );
      })}
    </>
  );
}

export function PostCard({
  author,
  date,
  text,
  media,
  counts,
  defaultLiked = false,
  defaultReposted = false,
  defaultBookmarked = false,
  onLike,
  onRepost,
  onBookmark,
  onComment,
  shareUrl,
  clampLines = 4,
  hrefForTag = (t) => `#tag-${t}`,
  hrefForMention = (h) => `#user-${h}`,
  locale = "en-US",
  className = "",
}: PostCardProps) {
  const id = useId();
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [on, setOn] = useState<Record<Toggle, boolean>>({
    like: defaultLiked,
    repost: defaultReposted,
    bookmark: defaultBookmarked,
  });
  const [delta, setDelta] = useState<Record<"like" | "repost", number>>({ like: 0, repost: 0 });
  const [burst, setBurst] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pending = useRef(new Set<Toggle>());

  // Only offer "Show more" when the text really is taller than the clamp. Re-checked on resize.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, text]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /** Optimistic toggle: flip now, call the server, flip back with a message if it fails. */
  const toggle = async (
    kind: Toggle,
    handler: ((v: boolean) => void | Promise<void>) | undefined,
    failText: string,
  ) => {
    if (pending.current.has(kind)) return;
    const next = !on[kind];
    pending.current.add(kind);
    setOn((s) => ({ ...s, [kind]: next }));
    if (kind !== "bookmark") setDelta((d) => ({ ...d, [kind]: d[kind] + (next ? 1 : -1) }));
    if (kind === "like" && next) setBurst((b) => b + 1);
    try {
      await handler?.(next);
    } catch {
      setOn((s) => ({ ...s, [kind]: !next }));
      if (kind !== "bookmark") setDelta((d) => ({ ...d, [kind]: d[kind] + (next ? -1 : 1) }));
      setToast(failText);
    } finally {
      pending.current.delete(kind);
    }
  };

  const share = async () => {
    const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `Post by ${author.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast("Link copied");
      }
    } catch {
      // The user closed the share sheet; nothing to do.
    }
  };

  const likes = counts.likes + delta.like;
  const reposts = counts.reposts + delta.repost;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(Date.parse(`${date.slice(0, 10)}T00:00:00Z`));

  const action = (activeClass: string, active: boolean) =>
    [
      "group inline-flex h-9 items-center gap-1 rounded-full px-1.5 text-sm tabular-nums sm:gap-1.5 sm:px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
      active ? activeClass : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
    ].join(" ");

  return (
    <article
      aria-labelledby={`${id}-author`}
      className={["relative w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5", className].join(" ")}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-zinc-950"
          style={{ background: author.color ?? "#a78bfa" }}
        >
          {author.name
            .split(/\s+/)
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p id={`${id}-author`} className="flex items-center gap-1 truncate text-sm">
            <span className="truncate font-semibold text-zinc-50">{author.name}</span>
            {author.verified && (
              <svg
                viewBox="0 0 20 20"
                className="size-4 shrink-0 text-sky-400"
                fill="currentColor"
                role="img"
                aria-label="Verified"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1.5 12.4 3l2.8-.2.9 2.7 2.2 1.7-.9 2.7.9 2.7-2.2 1.7-.9 2.7-2.8-.2L10 18.5 7.6 17l-2.8.2-.9-2.7-2.2-1.7.9-2.7-.9-2.7 2.2-1.7.9-2.7L7.6 3 10 1.5Zm3.7 6.2a.75.75 0 0 0-1.1-1l-3.6 3.9-1.6-1.6a.75.75 0 1 0-1.1 1.1l2.2 2.1a.75.75 0 0 0 1.1 0l4.1-4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </p>
          <p className="truncate text-xs text-zinc-500">
            @{author.handle} · <time dateTime={date}>{dateLabel}</time>
          </p>
        </div>
      </header>

      <p
        ref={bodyRef}
        id={`${id}-body`}
        className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-zinc-200"
        style={
          expanded
            ? undefined
            : ({
                display: "-webkit-box",
                WebkitLineClamp: clampLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } as CSSProperties)
        }
      >
        <RichText text={text} tagHref={hrefForTag} mentionHref={hrefForMention} />
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-body`}
          onClick={() => setExpanded((x) => !x)}
          className="mt-1 rounded text-sm font-medium text-sky-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {media && <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">{media}</div>}

      <footer className="mt-3 flex items-center justify-between gap-1 border-t border-zinc-800/80 pt-2">
        <button
          type="button"
          onClick={onComment}
          className={action("", false)}
          aria-label={`Comment, ${counts.comments} comments`}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="size-[18px]"
            aria-hidden="true"
          >
            <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3V5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
          </svg>
          {compact(counts.comments, locale)}
        </button>

        <button
          type="button"
          aria-pressed={on.repost}
          aria-label={`Repost, ${reposts} reposts`}
          onClick={() => toggle("repost", onRepost, "Couldn't repost. Try again.")}
          className={action("text-emerald-400 hover:bg-emerald-500/10", on.repost)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="size-[18px]"
            aria-hidden="true"
          >
            <path
              d="M4 8V6a2 2 0 0 1 2-2h9m0 0-2.5-2.5M15 4l-2.5 2.5M16 12v2a2 2 0 0 1-2 2H5m0 0 2.5 2.5M5 16l2.5-2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {compact(reposts, locale)}
        </button>

        <button
          type="button"
          aria-pressed={on.like}
          aria-label={`Like, ${likes} likes`}
          onClick={() => toggle("like", onLike, "Couldn't like this post. Try again.")}
          className={action("text-pink-400 hover:bg-pink-500/10", on.like)}
        >
          <span className="relative grid size-[18px] place-items-center" aria-hidden="true">
            {/* Burst ring replays on every new like (the key restarts the animation). */}
            {burst > 0 && on.like && (
              <span
                key={burst}
                className="absolute inset-0 animate-ping rounded-full bg-pink-400/40 [animation-iteration-count:1] motion-reduce:hidden"
              />
            )}
            <svg
              viewBox="0 0 24 24"
              className={["size-[18px] transition-transform", on.like ? "scale-110" : ""].join(" ")}
            >
              <path
                d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.4 1.1 4.9 2.9 1.5-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"
                fill={on.like ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {compact(likes, locale)}
        </button>

        <div className="flex items-center">
          <button
            type="button"
            aria-pressed={on.bookmark}
            aria-label={on.bookmark ? "Remove bookmark" : "Bookmark"}
            onClick={() => toggle("bookmark", onBookmark, "Couldn't save the bookmark. Try again.")}
            className={action("text-sky-400 hover:bg-sky-500/10", on.bookmark)}
          >
            <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden="true">
              <path
                d="M5 3h10v14l-5-3.5L5 17V3Z"
                fill={on.bookmark ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" onClick={share} aria-label="Share" className={action("", false)}>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="size-[18px]"
              aria-hidden="true"
            >
              <path
                d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </footer>

      <p
        role="status"
        className={[
          "pointer-events-none absolute inset-x-4 bottom-14 rounded-lg bg-zinc-100 px-3 py-2 text-center text-sm text-zinc-950 shadow-lg transition-opacity motion-reduce:transition-none",
          toast ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {toast}
      </p>
    </article>
  );
}

export default PostCard;
