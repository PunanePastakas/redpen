import { AlertTriangle, Bot, CheckCircle2, Info } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/classnames"

type NoticeVariant = "info" | "ai" | "warning" | "danger" | "success" | "correction"

type NoticeProps = {
  variant?: NoticeVariant
  title?: string
  children: ReactNode
  className?: string
  icon?: ReactNode
}

const variantClass: Record<NoticeVariant, string> = {
  info: "border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] text-[var(--rp-text)]",
  ai: "border-[var(--rp-primary)] bg-[var(--rp-primary-wash)] text-[var(--rp-primary-strong)]",
  warning: "border-[var(--rp-brass)] bg-[var(--rp-brass-soft)] text-[var(--rp-brass-strong)]",
  danger: "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] text-[var(--rp-correction)]",
  success: "border-[var(--rp-success)] bg-[var(--rp-success-soft)] text-[var(--rp-success)]",
  correction: "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] text-[var(--rp-text)]"
}

const defaultIcons: Record<NoticeVariant, ReactNode> = {
  info: <Info aria-hidden="true" size={18} />,
  ai: <Bot aria-hidden="true" size={18} />,
  warning: <AlertTriangle aria-hidden="true" size={18} />,
  danger: <AlertTriangle aria-hidden="true" size={18} />,
  success: <CheckCircle2 aria-hidden="true" size={18} />,
  correction: <AlertTriangle aria-hidden="true" size={18} />
}

export function Notice({ variant = "info", title, children, className, icon }: NoticeProps) {
  return (
    <div className={cn("rounded-[var(--rp-radius-panel)] border p-3 text-sm leading-6", variantClass[variant], className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon ?? defaultIcons[variant]}</span>
        <div className="min-w-0">
          {title ? <p className="font-semibold leading-5">{title}</p> : null}
          <div className={title ? "mt-1" : ""}>{children}</div>
        </div>
      </div>
    </div>
  )
}
