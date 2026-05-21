import type { HTMLAttributes } from "react"
import { cn } from "@/lib/classnames"

export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-center gap-1 border-b border-[var(--rp-border)] bg-[var(--rp-surface-warm)] px-3 py-2", className)} {...props} />
}

export function ToolbarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-1", className)} {...props} />
}
