"use client"

import { Link2 } from "lucide-react"
import { AuthPanel } from "@/components/auth-panel"

type GlobalNavbarProps = {
  shareLink?: string | null
}

export function GlobalNavbar({ shareLink }: GlobalNavbarProps) {
  return (
    <header className="border-b-2 border-[var(--rp-ink)] bg-[var(--rp-surface-warm)] px-4 py-3 shadow-[0_4px_0_rgba(17,17,17,0.08)]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-12 w-3 border border-[var(--rp-ink)] bg-[var(--rp-correction)] shadow-[3px_3px_0_var(--rp-ink)]" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold leading-none text-[var(--rp-ink)]">RedPen</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--rp-muted)]">AI-assisted mathematics test grading</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AuthPanel />
          {shareLink ? (
            <a className="inline-flex min-h-10 items-center gap-2 rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-sm font-semibold hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]" href={shareLink}>
              <Link2 size={16} />
              Student link
            </a>
          ) : null}
        </div>
      </div>
    </header>
  )
}
