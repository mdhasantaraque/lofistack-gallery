"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";

export type WizardValues = Record<string, string>;

export interface WizardField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "password" | "textarea" | "select";
  options?: { label: string; value: string }[];
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  /** Return an error message, or null when the value is fine. Gets every value for cross-field checks. */
  validate?: (value: string, values: WizardValues) => string | null;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: WizardField[];
}

export interface FormWizardProps {
  steps: WizardStep[];
  /** May return a promise. A rejection shows its message and keeps the form. */
  onSubmit: (values: WizardValues) => void | Promise<void>;
  initialValues?: WizardValues;
  /** Adds a final step that lists every answer with Edit links. */
  showReview?: boolean;
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
  /** Any CSS color for the stepper, focus rings and primary button. */
  accent?: string;
  className?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: WizardField, value: string, values: WizardValues): string | null {
  const v = value.trim();
  if (field.required && !v) return `Enter your ${field.label.toLowerCase()}`;
  if (!v) return null;
  if (field.type === "email" && !EMAIL.test(v)) return "Enter an email address like name@example.com";
  if (field.minLength && v.length < field.minLength)
    return `${field.label} must be at least ${field.minLength} characters`;
  return field.validate?.(value, values) ?? null;
}

/** 0-4, from length and character variety. Good enough for a hint, not a security check. */
function passwordScore(pw: string) {
  if (!pw) return 0;
  let score = pw.length >= 12 ? 2 : pw.length >= 8 ? 1 : 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (kinds >= 3) score += 1;
  if (kinds === 4 && pw.length >= 10) score += 1;
  return Math.min(score, 4);
}
const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["#71717a", "#f87171", "#fbbf24", "#a3e635", "#34d399"];

const inputBase =
  "block w-full rounded-lg border bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)] disabled:opacity-60";

export function FormWizard({
  steps,
  onSubmit,
  initialValues = {},
  showReview = true,
  submitLabel = "Submit",
  successTitle = "All done",
  successMessage = "Your details were sent.",
  accent = "#818cf8",
  className = "",
}: FormWizardProps) {
  const id = useId();
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [summaryToken, setSummaryToken] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);

  const total = steps.length + (showReview ? 1 : 0);
  const isReview = showReview && stepIndex === steps.length;
  const step = steps[stepIndex];

  // Move focus to the error summary after a failed Next, and to the new heading after a step change.
  useEffect(() => {
    if (summaryToken) summaryRef.current?.focus();
  }, [summaryToken]);
  useEffect(() => {
    if (navigated.current) headingRef.current?.focus();
  }, [stepIndex, done]);

  const stepErrors = (index: number, vals: WizardValues) => {
    const out: Record<string, string> = {};
    for (const field of steps[index].fields) {
      const msg = validateField(field, vals[field.name] ?? "", vals);
      if (msg) out[field.name] = msg;
    }
    return out;
  };

  const setValue = (name: string, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    // After the first failed attempt, errors update as the user fixes them.
    if (showErrors && !isReview) setErrors(stepErrors(stepIndex, next));
  };

  const goTo = (index: number) => {
    navigated.current = true;
    setErrors({});
    setShowErrors(false);
    setSubmitError(null);
    setStepIndex(index);
    setVisited((v) => Math.max(v, index));
  };

  const next = () => {
    const found = stepErrors(stepIndex, values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setShowErrors(true);
      setSummaryToken((t) => t + 1);
      return;
    }
    goTo(stepIndex + 1);
  };

  const submit = async () => {
    // Re-check everything in case an earlier answer was edited into an invalid state.
    for (let i = 0; i < steps.length; i++) {
      const found = stepErrors(i, values);
      if (Object.keys(found).length > 0) {
        goTo(i);
        setErrors(found);
        setShowErrors(true);
        setSummaryToken((t) => t + 1);
        return;
      }
    }
    setPending(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
      navigated.current = true;
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (stepIndex < total - 1) next();
    else void submit();
  };

  const restart = () => {
    navigated.current = true;
    setValues(initialValues);
    setDone(false);
    setVisited(0);
    setStepIndex(0);
  };

  const style = { "--fw-accent": accent } as CSSProperties;
  const errorList = Object.entries(errors);

  if (done) {
    return (
      <div
        style={style}
        className={["rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center", className].join(" ")}
      >
        <div
          className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-6">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-xl font-semibold text-zinc-50 focus:outline-none">
          {successTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{successMessage}</p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 h-10 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)]"
        >
          Start again
        </button>
      </div>
    );
  }

  const renderField = (field: WizardField) => {
    const fieldId = `${id}-${field.name}`;
    const value = values[field.name] ?? "";
    const error = showErrors ? errors[field.name] : undefined;
    const describedBy =
      [field.hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
    const common = {
      id: fieldId,
      name: field.name,
      value,
      required: field.required,
      disabled: pending,
      autoComplete: field.autoComplete,
      placeholder: field.placeholder,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
      className: [inputBase, error ? "border-red-400/80" : "border-zinc-700 hover:border-zinc-600"].join(" "),
    };
    const isPassword = field.type === "password";
    const score = isPassword ? passwordScore(value) : 0;

    return (
      <div key={field.name}>
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-200">
          {field.label}
          {!field.required && <span className="ml-1 font-normal text-zinc-500">(optional)</span>}
        </label>
        {field.hint && (
          <p id={`${fieldId}-hint`} className="mt-0.5 text-xs text-zinc-500">
            {field.hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-xs font-medium text-red-300">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        <div className="relative mt-1.5">
          {field.type === "textarea" ? (
            <textarea
              {...common}
              rows={3}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={`${common.className} py-2`}
            />
          ) : field.type === "select" ? (
            <select
              {...common}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={`${common.className} h-10`}
            >
              <option value="">Choose…</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...common}
              type={isPassword && revealed[field.name] ? "text" : (field.type ?? "text")}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={`${common.className} h-10 ${isPassword ? "pr-16" : ""}`}
            />
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((r) => ({ ...r, [field.name]: !r[field.name] }))}
              aria-pressed={revealed[field.name] ?? false}
              aria-controls={fieldId}
              className="absolute inset-y-1 right-1 rounded-md px-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)]"
            >
              {revealed[field.name] ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {isPassword && value && (
          <div className="mt-2 flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="h-1 flex-1 rounded-full bg-zinc-800 transition-colors"
                  style={n <= score ? { background: STRENGTH_COLOR[score] } : undefined}
                />
              ))}
            </div>
            <span className="w-16 text-right text-xs" style={{ color: STRENGTH_COLOR[score] }}>
              {STRENGTH[score]}
            </span>
          </div>
        )}
      </div>
    );
  };

  const titles = [...steps.map((s) => s.title), ...(showReview ? ["Review"] : [])];

  return (
    <form
      noValidate
      onSubmit={onFormSubmit}
      style={style}
      aria-labelledby={`${id}-heading`}
      className={["rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8", className].join(" ")}
    >
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {titles.map((title, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "upcoming";
          const reachable = i <= visited && i !== stepIndex && !pending;
          return (
            <li key={title} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => goTo(i)}
                aria-current={state === "current" ? "step" : undefined}
                className="group flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)] disabled:cursor-default"
              >
                <span
                  className={[
                    "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                    state === "done"
                      ? "border-[var(--fw-accent)] bg-[var(--fw-accent)] text-zinc-950 group-enabled:group-hover:brightness-110"
                      : state === "current"
                        ? "border-[var(--fw-accent)] text-[var(--fw-accent)]"
                        : "border-zinc-700 text-zinc-500",
                  ].join(" ")}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span
                  className={[
                    "hidden text-sm sm:inline",
                    state === "upcoming" ? "text-zinc-500" : "text-zinc-200",
                  ].join(" ")}
                >
                  {title}
                </span>
                <span className="sr-only">
                  {state === "done" ? " (completed)" : state === "current" ? " (current step)" : ""}
                </span>
              </button>
              {i < titles.length - 1 && (
                <span
                  aria-hidden="true"
                  className={[
                    "h-px flex-1 transition-colors",
                    i < stepIndex ? "bg-[var(--fw-accent)]" : "bg-zinc-800",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Step {stepIndex + 1} of {total}
      </p>
      <h2
        id={`${id}-heading`}
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 text-xl font-semibold text-zinc-50 focus:outline-none"
      >
        {isReview ? "Check your answers" : step.title}
      </h2>
      {!isReview && step.description && <p className="mt-1 text-sm text-zinc-400">{step.description}</p>}

      {showErrors && errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={`${id}-summary`}
          className="mt-5 rounded-xl border border-red-400/40 bg-red-950/40 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <p id={`${id}-summary`} className="text-sm font-semibold text-red-200">
            Fix {errorList.length === 1 ? "this problem" : `these ${errorList.length} problems`} to continue
          </p>
          <ul className="mt-2 space-y-1 text-sm" role="list">
            {errorList.map(([name, msg]) => (
              <li key={name}>
                <a
                  href={`#${id}-${name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`${id}-${name}`)?.focus();
                  }}
                  className="text-red-300 underline underline-offset-2 hover:text-red-100"
                >
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {isReview
          ? steps.map((s, i) => (
              <section
                key={s.id}
                className="rounded-xl border border-zinc-800 p-4"
                aria-labelledby={`${id}-review-${s.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 id={`${id}-review-${s.id}`} className="text-sm font-semibold text-zinc-200">
                    {s.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    disabled={pending}
                    className="rounded text-sm font-medium text-[var(--fw-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)]"
                  >
                    Edit<span className="sr-only"> {s.title}</span>
                  </button>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
                  {s.fields.map((f) => {
                    const raw = values[f.name] ?? "";
                    const shown =
                      f.type === "password"
                        ? raw && "•".repeat(Math.min(raw.length, 12))
                        : f.type === "select"
                          ? (f.options?.find((o) => o.value === raw)?.label ?? raw)
                          : raw;
                    return (
                      <div key={f.name} className="contents">
                        <dt className="text-zinc-500">{f.label}</dt>
                        <dd className="break-words text-zinc-100">
                          {shown || <span className="text-zinc-600">Not given</span>}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))
          : step.fields.map(renderField)}
      </div>

      {submitError && (
        <p role="alert" className="mt-5 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => goTo(stepIndex - 1)}
          disabled={stepIndex === 0 || pending}
          className="h-10 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)] disabled:invisible"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--fw-accent)] px-5 text-sm font-semibold text-zinc-950 transition-[filter,transform] hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fw-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending && (
            <svg
              className="size-4 animate-spin motion-reduce:animate-none"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {pending ? "Sending…" : stepIndex === total - 1 ? submitLabel : "Continue"}
        </button>
      </div>
    </form>
  );
}

export default FormWizard;
