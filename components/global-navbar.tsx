"use client"

import { Link2 } from "lucide-react"
import { AuthPanel } from "@/components/auth-panel"

type GlobalNavbarProps = {
  shareLink?: string | null
}

export function GlobalNavbar({ shareLink }: GlobalNavbarProps) {
  return (
    <header className="border-b border-[#dbe2dc] bg-white px-4 py-3">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">RedPen</h1>
          <p className="text-sm text-[#647067]">AI-assisted mathematics test grading</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AuthPanel />
          {shareLink ? (
            <a className="inline-flex items-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]" href={shareLink}>
              <Link2 size={16} />
              Student link
            </a>
          ) : null}
        </div>
      </div>
    </header>
  )
}
