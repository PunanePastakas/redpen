import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/classnames"

type PanelVariant = "default" | "selected" | "paper" | "warning" | "danger" | "success" | "subtle"

type PanelProps = HTMLAttributes<HTMLElement> & {
  variant?: PanelVariant
  children: ReactNode
}

const variantClass: Record<PanelVariant, string> = {
  default: "border-[var(--rp-border)] bg-[var(--rp-surface)]",
  selected: "border-[var(--rp-ink)] bg-[var(--rp-surface)] shadow-[var(--rp-shadow-ink-soft)]",
  paper: "border-[var(--rp-ink)] bg-[var(--rp-surface-warm)] shadow-[var(--rp-shadow-ink-soft)]",
  warning: "border-[var(--rp-brass)] bg-[var(--rp-brass-soft)]",
  danger: "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)]",
  success: "border-[var(--rp-success)] bg-[var(--rp-success-soft)]",
  subtle: "border-[var(--rp-border)] bg-[var(--rp-surface-subtle)]"
}

export function Panel({ variant = "default", className, children, ...props }: PanelProps) {
  return (
    <section className={cn("rounded-[var(--rp-radius-panel)] border p-4 shadow-[var(--rp-shadow-ink-soft)]", variantClass[variant], className)} {...props}>
      {children}
    </section>
  )
}

export function PanelHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-[var(--rp-border)] pb-3", className)} {...props}>
      {children}
    </div>
  )
}
