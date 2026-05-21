import type { ReactNode } from "react"
import { cn } from "@/lib/classnames"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  body: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-56 flex-col items-center justify-center rounded-[var(--rp-radius-panel)] border border-dashed border-[var(--rp-border-strong)] bg-[var(--rp-surface-warm)] p-6 text-center", className)}>
      {icon ? <div className="mb-4 text-[var(--rp-primary)]">{icon}</div> : null}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--rp-muted)]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
