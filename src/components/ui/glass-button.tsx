import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

export type GlassButtonVariant = "clear" | "frosted";
export type GlassButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps extends ComponentPropsWithRef<"button"> {
  /** Glass density. `clear` is lighter, `frosted` blurs and tints more. */
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  /** Any CSS color used to tint the glass. */
  tint?: string;
  /** Shows a spinner, sets `aria-busy` and blocks clicks. */
  loading?: boolean;
  /** Label announced and shown while loading. Defaults to the children. */
  loadingText?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<GlassButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-6 text-[15px] gap-2 rounded-2xl",
  lg: "h-14 px-8 text-base gap-2.5 rounded-[1.25rem]",
};

const variantClasses: Record<GlassButtonVariant, string> = {
  clear:
    "backdrop-blur-md bg-[color-mix(in_oklab,var(--glass-tint)_16%,transparent)] enabled:hover:bg-[color-mix(in_oklab,var(--glass-tint)_26%,transparent)]",
  frosted:
    "backdrop-blur-xl backdrop-saturate-150 bg-[color-mix(in_oklab,var(--glass-tint)_30%,transparent)] enabled:hover:bg-[color-mix(in_oklab,var(--glass-tint)_42%,transparent)]",
};

function Spinner() {
  return (
    <svg
      className="size-[1.1em] animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function GlassButton({
  variant = "clear",
  size = "md",
  tint = "#ffffff",
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  style,
  children,
  type = "button",
  ...rest
}: GlassButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{ "--glass-tint": tint, ...style } as CSSProperties}
      className={[
        "group relative isolate inline-flex select-none items-center justify-center overflow-hidden",
        "border border-white/30 font-medium text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-1px_0_rgb(0_0_0/0.1),0_10px_30px_-12px_rgb(0_0_0/0.5)]",
        "transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out",
        "enabled:hover:-translate-y-0.5 enabled:hover:border-white/50",
        "enabled:hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_16px_36px_-12px_rgb(0_0_0/0.55)]",
        "enabled:active:translate-y-0 enabled:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "motion-reduce:transition-none motion-reduce:enabled:hover:translate-y-0",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {/* Top highlight that gives the glass its curved look */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/35 to-transparent"
      />
      {/* Light sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-full -z-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-enabled:group-hover:translate-x-[400%] motion-reduce:hidden"
      />
      {loading ? <Spinner /> : leftIcon}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon}
    </button>
  );
}

export default GlassButton;
