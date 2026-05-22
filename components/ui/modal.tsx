"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/classnames"

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  pending?: boolean
  className?: string
}

export function Modal({ open, title, description, children, onClose, pending = false, className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-modal-title`

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, open, pending])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,17,17,0.42)] px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn("max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--rp-radius-panel)] border-2 border-[var(--rp-ink)] bg-[var(--rp-surface)] p-5 shadow-[var(--rp-shadow-ink)] outline-none", className)}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--rp-border)] pb-3">
          <div>
            <h2 className="font-display text-2xl font-semibold leading-none" id={titleId}>{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-[var(--rp-muted)]">{description}</p> : null}
          </div>
          <IconButton aria-label={`Close ${title}`} disabled={pending} onClick={onClose} title="Close">
            <X size={18} />
          </IconButton>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
