import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/classnames"

type StatusTone = "neutral" | "primary" | "success" | "warning" | "danger" | "correction"

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone
  children: ReactNode
  icon?: ReactNode
}

const toneClass: Record<StatusTone, string> = {
  neutral: "border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] text-[var(--rp-muted-strong)]",
  primary: "border-[var(--rp-primary)] bg-[var(--rp-primary-soft)] text-[var(--rp-primary-strong)]",
  success: "border-[var(--rp-success)] bg-[var(--rp-success-soft)] text-[var(--rp-success)]",
  warning: "border-[var(--rp-brass)] bg-[var(--rp-brass-soft)] text-[var(--rp-brass-strong)]",
  danger: "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] text-[var(--rp-correction)]",
  correction: "border-[var(--rp-correction)] bg-[var(--rp-correction-soft)] text-[var(--rp-correction-strong)]"
}

export function StatusBadge({ tone = "neutral", icon, children, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1 rounded-[var(--rp-radius-control)] border px-2 py-1 text-xs font-semibold", toneClass[tone], className)} {...props}>
      {icon}
      {children}
    </span>
  )
}
