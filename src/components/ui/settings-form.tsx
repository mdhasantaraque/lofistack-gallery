"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface ProfileSettings {
  avatarUrl: string | null;
  name: string;
  username: string;
  email: string;
  bio: string;
  website: string;
  timezone: string;
  emailDigest: boolean;
  mentions: boolean;
}

export interface SettingsFormProps {
  initialValues: ProfileSettings;
  /** May return a promise. On success the saved values become the new baseline. */
  onSave: (values: ProfileSettings, avatarFile: File | null) => void | Promise<void>;
  /** Resolve true when the username is free. Called 400 ms after typing stops. */
  checkUsername?: (username: string) => Promise<boolean>;
  timezones?: { value: string; label: string }[];
  bioLimit?: number;
  /** Max avatar size in bytes. */
  maxAvatarSize?: number;
  accent?: string;
  className?: string;
}

type Field = keyof ProfileSettings;
type UsernameState = "idle" | "pending" | "checking" | "available" | "taken";

const LABELS: Record<Field, string> = {
  avatarUrl: "Photo",
  name: "Display name",
  username: "Username",
  email: "Email",
  bio: "Bio",
  website: "Website",
  timezone: "Time zone",
  emailDigest: "Weekly email digest",
  mentions: "Mention notifications",
};

const DEFAULT_TIMEZONES = [
  { value: "Asia/Dhaka", label: "Dhaka (GMT+6)" },
  { value: "Asia/Kolkata", label: "Kolkata (GMT+5:30)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
];

function validate(v: ProfileSettings, bioLimit: number): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!v.name.trim()) e.name = "Enter a display name";
  if (!/^[a-z0-9_]{3,20}$/.test(v.username)) e.username = "3–20 lowercase letters, numbers or underscores";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Enter an email like name@example.com";
  if (v.bio.length > bioLimit) e.bio = `Keep it under ${bioLimit} characters`;
  if (v.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(v.website))
    e.website = "Start with https:// and include a domain";
  return e;
}

export function SettingsForm({
  initialValues,
  onSave,
  checkUsername,
  timezones = DEFAULT_TIMEZONES,
  bioLimit = 160,
  maxAvatarSize = 2 * 1024 * 1024,
  accent = "#34d399",
  className = "",
}: SettingsFormProps) {
  const id = useId();
  const [saved, setSaved] = useState(initialValues);
  const [values, setValues] = useState(initialValues);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState<UsernameState>("idle");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const checkId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const changed = (Object.keys(values) as Field[]).filter((k) => values[k] !== saved[k]);
  const dirty = changed.length > 0;
  const errors = validate(values, bioLimit);
  const showError = (f: Field) => (touched[f] || submitted) && errors[f];

  // Check the username 400 ms after typing stops. Stale answers are ignored by request id.
  useEffect(() => {
    if (!checkUsername || values.username === saved.username || errors.username) return;
    const request = ++checkId.current;
    const timer = window.setTimeout(async () => {
      setUsername("checking");
      const free = await checkUsername(values.username).catch(() => true);
      if (request === checkId.current) setUsername(free ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timer);
  }, [values.username, saved.username, errors.username, checkUsername]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Free every photo preview URL this form created when it unmounts. Not earlier: a saved preview
  // can still be the baseline that Discard or Undo brings back.
  const previewUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const set = <K extends Field>(field: K, value: ProfileSettings[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setToast(null);
    if (field === "username") {
      checkId.current += 1;
      setUsername(value === saved.username ? "idle" : "pending");
    }
  };

  const undo = (field: Field) => {
    set(field, saved[field]);
    if (field === "avatarUrl") setAvatarFile(null);
  };

  const onAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setToast({ kind: "error", text: "Choose an image file (PNG, JPG, WebP)." });
    if (file.size > maxAvatarSize)
      return setToast({ kind: "error", text: `That photo is over ${Math.round(maxAvatarSize / 1024 / 1024)} MB.` });
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    setAvatarFile(file);
    set("avatarUrl", url);
  };

  const discard = () => {
    setValues(saved);
    setAvatarFile(null);
    setTouched({});
    setSubmitted(false);
    setUsername("idle");
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!dirty || saving) return;
    setSubmitted(true);
    const firstInvalid = (Object.keys(errors) as Field[])[0];
    if (firstInvalid || username === "taken") {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid ?? "username"}"]`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave(values, avatarFile);
      setSaved(values);
      setAvatarFile(null);
      setTouched({});
      setSubmitted(false);
      setUsername("idle");
      setToast({ kind: "ok", text: `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}.` });
    } catch (err) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Couldn't save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd+S saves while focus is anywhere in the form.
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save();
    }
  };

  const input =
    "block h-10 w-full rounded-lg border bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] disabled:opacity-60";

  // Render helpers, called as functions. Declaring them as components inside this function would
  // remount every input on each keystroke and drop focus.
  const row = (field: Field, children: ReactNode, hint?: ReactNode) => {
    const err = showError(field);
    return (
      <div key={field} className="grid gap-1.5 sm:grid-cols-[11rem_1fr] sm:gap-6">
        <div className="flex items-center gap-2 sm:block sm:pt-2">
          <label htmlFor={`${id}-${field}`} className="text-sm font-medium text-zinc-200">
            {LABELS[field]}
          </label>
          {changed.includes(field) && (
            <span className="text-xs text-[var(--sf-accent)] sm:mt-1 sm:block">
              Edited ·{" "}
              <button
                type="button"
                onClick={() => undo(field)}
                className="underline underline-offset-2 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
              >
                Undo<span className="sr-only"> {LABELS[field]}</span>
              </button>
            </span>
          )}
        </div>
        <div className="min-w-0">
          {children}
          {err ? (
            <p id={`${id}-${field}-msg`} className="mt-1.5 text-xs text-red-300">
              {err}
            </p>
          ) : (
            hint && (
              <p id={`${id}-${field}-msg`} className="mt-1.5 text-xs text-zinc-500">
                {hint}
              </p>
            )
          )}
        </div>
      </div>
    );
  };

  const fieldProps = (field: Field) => ({
    id: `${id}-${field}`,
    name: field,
    disabled: saving,
    "aria-invalid": showError(field) ? true : undefined,
    "aria-describedby": `${id}-${field}-msg`,
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
    className: `${input} ${showError(field) ? "border-red-400/80" : "border-zinc-700 hover:border-zinc-600"}`,
  });

  const toggleRow = (field: "emailDigest" | "mentions", description: string) => (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 p-4">
      <div>
        <p id={`${id}-${field}-label`} className="text-sm font-medium text-zinc-200">
          {LABELS[field]}
          {changed.includes(field) && <span className="ml-2 text-xs font-normal text-[var(--sf-accent)]">Edited</span>}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        name={field}
        aria-checked={values[field]}
        aria-labelledby={`${id}-${field}-label`}
        disabled={saving}
        onClick={() => set(field, !values[field])}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none",
          values[field] ? "bg-[var(--sf-accent)]" : "bg-zinc-700",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] motion-reduce:transition-none",
            values[field] ? "left-[1.375rem]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );

  const usernameHint = {
    idle: `Your profile lives at /${values.username || "username"}`,
    pending: "Checking soon…",
    checking: "Checking availability…",
    available: <span className="text-emerald-300">✓ @{values.username} is available</span>,
    taken: <span className="text-red-300">@{values.username} is taken. Try another.</span>,
  }[username];

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={save}
      onKeyDown={onKeyDown}
      style={{ "--sf-accent": accent } as CSSProperties}
      className={["relative space-y-6", className].join(" ")}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold text-zinc-50">
        Profile
      </h2>

      {row(
        "avatarUrl",
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800 text-lg font-semibold text-zinc-300">
            {values.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs can't go through next/image
              <img src={values.avatarUrl} alt="Profile photo preview" className="size-full object-cover" />
            ) : (
              values.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            )}
          </span>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-800 focus-within:ring-2 focus-within:ring-[var(--sf-accent)]">
            Change photo
            <input
              id={`${id}-avatarUrl`}
              name="avatarUrl"
              type="file"
              accept="image/*"
              onChange={onAvatar}
              disabled={saving}
              aria-describedby={`${id}-avatarUrl-msg`}
              className="sr-only"
            />
          </label>
          {values.avatarUrl && (
            <button
              type="button"
              onClick={() => {
                set("avatarUrl", null);
                setAvatarFile(null);
              }}
              className="text-sm text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
            >
              Remove
            </button>
          )}
        </div>,
        "PNG, JPG or WebP, up to 2 MB.",
      )}

      {row(
        "name",
        <input
          {...fieldProps("name")}
          value={values.name}
          autoComplete="name"
          onChange={(e) => set("name", e.target.value)}
        />,
      )}

      {row(
        "username",
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">@</span>
          <input
            {...fieldProps("username")}
            aria-invalid={showError("username") || username === "taken" ? true : undefined}
            value={values.username}
            autoComplete="username"
            spellCheck={false}
            onChange={(e) => set("username", e.target.value.toLowerCase())}
            className={`${fieldProps("username").className} pl-7 ${username === "taken" ? "border-red-400/80" : ""}`}
          />
        </div>,
        <span aria-live="polite">{usernameHint}</span>,
      )}

      {row(
        "email",
        <input
          {...fieldProps("email")}
          type="email"
          value={values.email}
          autoComplete="email"
          onChange={(e) => set("email", e.target.value)}
        />,
      )}

      {row(
        "bio",
        <textarea
          {...fieldProps("bio")}
          rows={3}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          className={`${fieldProps("bio").className} h-auto py-2`}
        />,
        <span className={values.bio.length > bioLimit ? "text-red-300" : ""}>
          {bioLimit - values.bio.length} characters left
        </span>,
      )}

      {row(
        "website",
        <input
          {...fieldProps("website")}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />,
      )}

      {row(
        "timezone",
        <select {...fieldProps("timezone")} value={values.timezone} onChange={(e) => set("timezone", e.target.value)}>
          {timezones.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>,
      )}

      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium text-zinc-200">Notifications</legend>
        {toggleRow("emailDigest", "A Monday summary of what changed in your projects.")}
        {toggleRow("mentions", "Email me when someone @mentions me.")}
      </fieldset>

      {toast && (
        <p
          role={toast.kind === "error" ? "alert" : "status"}
          className={[
            "rounded-lg px-3 py-2 text-sm",
            toast.kind === "ok" ? "bg-emerald-500/10 text-emerald-200" : "bg-red-950/60 text-red-200",
          ].join(" ")}
        >
          {toast.text}
        </p>
      )}

      {/* Unsaved-changes bar. Sticks to the bottom of the viewport while there's something to save. */}
      <div
        aria-hidden={!dirty}
        inert={!dirty}
        className={[
          "sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur transition-[opacity,translate] duration-200 motion-reduce:transition-none",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        ].join(" ")}
      >
        <p className="text-sm text-zinc-200" aria-live="polite">
          {changed.length} unsaved change{changed.length === 1 ? "" : "s"}
        </p>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={discard}
            disabled={saving}
            className="h-9 rounded-lg px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-keyshortcuts="Control+S Meta+S"
            className="h-9 rounded-lg bg-[var(--sf-accent)] px-4 text-sm font-semibold text-zinc-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default SettingsForm;
