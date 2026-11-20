"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Status = "idle" | "verifying" | "error" | "success" | "locked";

export interface OtpFormProps {
  /** Resolve when the code is right. Reject (or return false) when it's wrong. */
  onVerify: (code: string) => Promise<boolean | void> | boolean | void;
  /** Sends a new code. Resets attempts and restarts the cooldown. */
  onResend?: () => Promise<void> | void;
  length?: number;
  /** Seconds before "Resend code" unlocks. */
  resendAfter?: number;
  maxAttempts?: number;
  title?: string;
  /** e.g. "We sent a code to h•••@example.com". */
  description?: ReactNode;
  /** Submit as soon as the last digit is entered. */
  autoSubmit?: boolean;
  successMessage?: string;
  accent?: string;
  className?: string;
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function OtpForm({
  onVerify,
  onResend,
  length = 6,
  resendAfter = 30,
  maxAttempts = 5,
  title = "Enter verification code",
  description,
  autoSubmit = true,
  successMessage = "Verified. You're all set.",
  accent = "#a78bfa",
  className = "",
}: OtpFormProps) {
  const id = useId();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(resendAfter);
  const [shake, setShake] = useState(0);
  const [message, setMessage] = useState("");

  const busy = status === "verifying" || status === "success" || status === "locked";
  const code = digits.join("");

  // Resend countdown. The interval only ticks; it never sets state from the effect body.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusAt = (i: number) => {
    const el = inputs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const verify = async (value: string) => {
    if (busy || value.length !== length) return;
    setStatus("verifying");
    setMessage("Checking code…");
    let ok = false;
    try {
      ok = (await onVerify(value)) !== false;
    } catch {
      ok = false;
    }
    if (ok) {
      setStatus("success");
      setMessage(successMessage);
      return;
    }
    const used = attempts + 1;
    setAttempts(used);
    setShake((s) => s + 1);
    setDigits(Array(length).fill(""));
    if (used >= maxAttempts) {
      setStatus("locked");
      setMessage("Too many wrong codes. Request a new one to try again.");
      return;
    }
    const left = maxAttempts - used;
    setStatus("error");
    setMessage(`That code didn't match. ${left} attempt${left === 1 ? "" : "s"} left.`);
    window.setTimeout(() => focusAt(0), 0);
  };

  /** Puts characters into the boxes starting at `start`, ignoring anything that isn't a digit. */
  const fill = (start: number, text: string) => {
    const chars = text
      .replace(/\D/g, "")
      .slice(0, length - start)
      .split("");
    if (!chars.length) return;
    const next = [...digits];
    chars.forEach((c, k) => (next[start + k] = c));
    setDigits(next);
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
    const done = next.every(Boolean);
    focusAt(done ? length - 1 : start + chars.length);
    if (done && autoSubmit) void verify(next.join(""));
  };

  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      // Clear this box, or if it's already empty, clear and move to the previous one.
      if (next[i]) next[i] = "";
      else if (i > 0) {
        next[i - 1] = "";
        focusAt(i - 1);
      }
      setDigits(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const onPaste = (i: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length < length) {
      setMessage(`Enter all ${length} digits.`);
      focusAt(digits.findIndex((d) => !d));
      return;
    }
    void verify(code);
  };

  const resend = async () => {
    if (cooldown > 0 || status === "success") return;
    try {
      await onResend?.();
      setAttempts(0);
      setStatus("idle");
      setDigits(Array(length).fill(""));
      setCooldown(resendAfter);
      setMessage("We sent a new code.");
      // The boxes are still disabled until this update renders, so focus on the next tick.
      window.setTimeout(() => focusAt(0), 0);
    } catch {
      setMessage("Couldn't send a new code. Try again in a moment.");
    }
  };

  const tone =
    status === "error" || status === "locked"
      ? "border-red-400/80"
      : status === "success"
        ? "border-emerald-400"
        : "border-zinc-700 focus:border-[var(--otp-accent)]";

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={`${id}-title`}
      style={{ "--otp-accent": accent } as CSSProperties}
      className={["w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8", className].join(" ")}
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold text-zinc-50">
        {title}
      </h2>
      {description && (
        <p id={`${id}-desc`} className="mt-1.5 text-sm text-zinc-400">
          {description}
        </p>
      )}

      <div
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-msg`}
        key={shake}
        className={[
          "mt-6 flex justify-between gap-2",
          shake ? "animate-[otp-shake_0.4s_ease-in-out] motion-reduce:animate-none" : "",
        ].join(" ")}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            // Lets phones offer the code from the SMS. Only the first box gets it.
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={status === "error" || status === "locked" ? true : undefined}
            disabled={busy}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={onKey(i)}
            onPaste={onPaste(i)}
            // onChange also catches autofill, which may drop the whole code into one box.
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              fill(i, v.length > 1 && d ? v.replace(d, "") || v : v);
            }}
            className={[
              "h-14 w-full min-w-0 rounded-xl border-2 bg-zinc-900 text-center text-2xl font-semibold tabular-nums text-zinc-50 caret-[var(--otp-accent)] transition-colors focus:outline-none disabled:opacity-60",
              tone,
            ].join(" ")}
          />
        ))}
      </div>

      <p
        id={`${id}-msg`}
        role={status === "error" || status === "locked" ? "alert" : "status"}
        className={[
          "mt-3 min-h-5 text-sm",
          status === "error" || status === "locked"
            ? "text-red-300"
            : status === "success"
              ? "text-emerald-300"
              : "text-zinc-400",
        ].join(" ")}
      >
        {message}
      </p>

      {!autoSubmit || status === "error" ? (
        <button
          type="submit"
          disabled={busy}
          className="mt-4 h-11 w-full rounded-lg bg-[var(--otp-accent)] text-sm font-semibold text-zinc-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--otp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50"
        >
          Verify
        </button>
      ) : null}

      {onResend && status !== "success" && (
        <p className="mt-5 text-sm text-zinc-400">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="rounded font-medium text-[var(--otp-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--otp-accent)] disabled:cursor-not-allowed disabled:text-zinc-500 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${formatTime(cooldown)}` : "Resend code"}
          </button>
        </p>
      )}
      <style>{`@keyframes otp-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
    </form>
  );
}

export default OtpForm;
