import { Loader2 } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/classnames"

type ButtonVariant = "primary" | "secondary" | "ink" | "danger" | "ghost" | "tool"
type ButtonSize = "sm" | "md" | "lg" | "icon"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--rp-ink)] bg-[var(--rp-primary)] text-white shadow-[3px_3px_0_var(--rp-ink)] hover:-translate-y-0.5 hover:bg-[var(--rp-primary-strong)] hover:shadow-[4px_4px_0_var(--rp-ink)]",
  secondary:
    "border-[var(--rp-border)] bg-[var(--rp-surface)] text-[var(--rp-text)] hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]",
  ink:
    "border-[var(--rp-ink)] bg-[var(--rp-ink)] text-white shadow-[3px_3px_0_var(--rp-correction)] hover:-translate-y-0.5 hover:bg-[var(--rp-text-soft)]",
  danger:
    "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] text-[var(--rp-correction)] hover:bg-[var(--rp-correction-soft)]",
  ghost:
    "border-transparent bg-transparent text-[var(--rp-muted-strong)] hover:border-[var(--rp-border)] hover:bg-[var(--rp-surface-warm)] hover:text-[var(--rp-text)]",
  tool:
    "border-[var(--rp-border)] bg-[var(--rp-surface)] text-[var(--rp-muted-strong)] hover:border-[var(--rp-ink)] hover:bg-[var(--rp-paper-soft)] hover:text-[var(--rp-correction)]"
}

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-8 px-2.5 py-1.5 text-xs",
  md: "min-h-10 px-3 py-2 text-sm",
  lg: "min-h-11 px-4 py-2.5 text-sm",
  icon: "h-10 w-10 p-0"
}

export function Button({ variant = "secondary", size = "md", loading = false, className, disabled, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--rp-radius-control)] border font-semibold leading-none transition disabled:translate-y-0 disabled:shadow-none",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : null}
      {children}
    </button>
  )
}
