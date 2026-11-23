"use client";

import { useState, type FormEvent } from "react";
import { TagInput } from "@/components/ui/tag-input";

const SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "Node.js",
  "GraphQL",
  "PostgreSQL",
  "Prisma",
  "Figma",
  "Accessibility",
  "Testing Library",
  "Playwright",
  "Docker",
  "AWS",
  "Python",
  "Go",
  "Rust",
  "C#",
  "Vue",
  "Svelte",
];

const COUNTRIES = ["Bangladesh", "India", "Nepal", "Sri Lanka", "Pakistan", "Bhutan", "Maldives"];

const validateSkill = (tag: string) => {
  if (tag.length < 2) return `"${tag}" is too short`;
  if (tag.length > 24) return "Keep tags under 24 characters";
  if (!/^[\p{L}\p{N} .+#-]+$/u.test(tag)) return `"${tag}" has characters that aren't allowed`;
  return null;
};

export default function TagInputDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>(["Bangladesh"]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(String(new FormData(e.currentTarget).get("skills") ?? ""));
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
      <TagInput
        label="Skills"
        name="skills"
        hint="Press Enter or comma to add. Paste a list like “Go, Rust; Docker”."
        defaultValue={["React", "TypeScript"]}
        suggestions={SKILLS}
        maxTags={8}
        validate={validateSkill}
      />
      <TagInput
        label="Regions"
        hint="Only the listed countries can be picked."
        value={regions}
        onChange={setRegions}
        suggestions={COUNTRIES}
        allowCustom={false}
        placeholder="Type a country…"
        accent="#38bdf8"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Save profile
        </button>
        <p className="min-w-0 text-xs text-zinc-500" aria-live="polite">
          {submitted !== null && (
            <>
              Sent <code className="break-all text-zinc-300">skills={submitted || "(empty)"}</code>
            </>
          )}
        </p>
      </div>
      <p className="text-xs text-zinc-500">
        Regions: <span className="text-zinc-300">{regions.join(", ") || "none"}</span>. Backspace from an empty box
        selects the last tag; press it again to remove. ← → move between tags.
      </p>
    </form>
  );
}
