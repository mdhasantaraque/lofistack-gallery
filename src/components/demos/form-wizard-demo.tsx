"use client";

import { useState } from "react";
import { FormWizard, type WizardStep } from "@/components/ui/form-wizard";

const steps: WizardStep[] = [
  {
    id: "account",
    title: "Account",
    description: "You'll use these to sign in.",
    fields: [
      { name: "name", label: "Full name", required: true, autoComplete: "name" },
      { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: true,
        minLength: 8,
        autoComplete: "new-password",
        hint: "At least 8 characters, with a letter and a number.",
        validate: (v) =>
          /[A-Za-z]/.test(v) && /\d/.test(v) ? null : "Password needs at least one letter and one number",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Set up where your team will work.",
    fields: [
      { name: "workspace", label: "Workspace name", required: true, placeholder: "Acme Studio" },
      {
        name: "slug",
        label: "Workspace URL",
        required: true,
        placeholder: "acme-studio",
        hint: "Lowercase letters, numbers and hyphens. You can't change this later.",
        validate: (v) =>
          /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? null : "Use only lowercase letters, numbers and single hyphens",
      },
      {
        name: "size",
        label: "Team size",
        type: "select",
        required: true,
        options: [
          { label: "Just me", value: "1" },
          { label: "2–10 people", value: "2-10" },
          { label: "11–50 people", value: "11-50" },
          { label: "51+ people", value: "51+" },
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    fields: [
      { name: "role", label: "Your role", placeholder: "Designer, developer, founder…" },
      { name: "goal", label: "What do you want to build first?", type: "textarea" },
    ],
  },
];

export default function FormWizardDemo() {
  const [failNext, setFailNext] = useState(false);

  const handleSubmit = async () => {
    const shouldFail = failNext;
    await new Promise((r) => setTimeout(r, 1200));
    if (shouldFail) {
      setFailNext(false);
      throw new Error("That workspace URL was just taken. Go back to Workspace and pick another one.");
    }
  };

  return (
    <div className="w-full rounded-2xl bg-zinc-900/40 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-xl">
        <FormWizard
          steps={steps}
          onSubmit={handleSubmit}
          submitLabel="Create workspace"
          successTitle="Workspace created"
          successMessage="We sent a confirmation link to your email."
        />
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            className="size-4 accent-indigo-400"
          />
          Make the next submit fail (shows the error state)
        </label>
      </div>
    </div>
  );
}
