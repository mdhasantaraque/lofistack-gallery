"use client";

import { useState } from "react";
import { FaqSection, type FaqItem } from "@/components/ui/faq-section";

const items: FaqItem[] = [
  {
    id: "free-plan",
    category: "Billing",
    question: "Is there a free plan?",
    answer:
      "Yes. The Starter plan is free forever and includes 3 projects and community support.\n\nYou only need a card when you upgrade to Pro or Team.",
    keywords: "cost price trial",
  },
  {
    id: "change-plan",
    category: "Billing",
    question: "Can I switch plans later?",
    answer:
      "Any time. Upgrades apply right away and you pay the difference for the rest of the month. Downgrades apply at the end of your billing period.",
    keywords: "upgrade downgrade",
  },
  {
    id: "refunds",
    category: "Billing",
    question: "Do you offer refunds?",
    answer:
      "If you're not happy in the first 14 days, write to us and we'll refund the full amount. No forms, no questions.",
    keywords: "money back cancel",
  },
  {
    id: "invite",
    category: "Teams",
    question: "How do I invite my team?",
    answer:
      "Open Settings, then Members, and paste their email addresses. Each person gets a link that expires after 7 days.\n\nOn the Team plan you can also turn on sign-in with Google Workspace so new hires join automatically.",
    keywords: "add members users seats",
  },
  {
    id: "roles",
    category: "Teams",
    question: "What can each role do?",
    answer:
      "Owners manage billing and members. Editors can create and change projects. Viewers can only look and comment.",
    keywords: "permissions admin access",
  },
  {
    id: "export",
    category: "Data",
    question: "Can I export my data?",
    answer:
      "Yes. Every project can be exported as JSON or CSV from its settings page, on every plan, including Starter.",
    keywords: "download backup leave",
  },
  {
    id: "security",
    category: "Data",
    question: "Where is my data stored and is it encrypted?",
    answer:
      "Data is stored in Frankfurt and Singapore. It's encrypted in transit with TLS 1.3 and at rest with AES-256.\n\nWe run a security review every quarter and publish the summary.",
    keywords: "privacy gdpr safe",
  },
];

export default function FaqSectionDemo() {
  const [votes, setVotes] = useState<string[]>([]);

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <FaqSection
          title="Questions, answered"
          description="Search, filter by topic, or share a link straight to an answer."
          items={items}
          defaultOpen={["free-plan"]}
          onFeedback={(id, helpful) =>
            setVotes((v) => [`${helpful ? "👍" : "👎"} ${items.find((i) => i.id === id)?.question}`, ...v].slice(0, 3))
          }
          emptyState={
            <>
              Can&apos;t find it?{" "}
              <a href="mailto:support@example.com" className="text-violet-300 underline underline-offset-2">
                Email support
              </a>{" "}
              and a person will reply within a day.
            </>
          }
        />
        {votes.length > 0 && (
          <ul className="mt-6 space-y-1 text-xs text-zinc-500" aria-label="Feedback received">
            {votes.map((v, i) => (
              <li key={i}>onFeedback: {v}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
