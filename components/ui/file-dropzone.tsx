"use client"

import { useRef, type ReactNode } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/classnames"

type FileDropzoneProps = {
  title: string
  body: string
  buttonLabel: string
  accept: string
  multiple?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  onFiles: (files: FileList | null) => void
  className?: string
}

export function FileDropzone({ title, body, buttonLabel, accept, multiple = false, disabled = false, loading = false, icon, onFiles, className }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn("rounded-[var(--rp-radius-panel)] border border-dashed border-[var(--rp-border-strong)] bg-[var(--rp-surface)] p-8 text-center shadow-[var(--rp-shadow-ink-soft)]", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--rp-ink)] bg-[var(--rp-primary-soft)] text-[var(--rp-primary-strong)]">
        {icon ?? <Upload aria-hidden="true" size={24} />}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--rp-muted)]">{body}</p>
      <input
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          onFiles(event.target.files)
          event.currentTarget.value = ""
        }}
        ref={inputRef}
        type="file"
      />
      <Button className="mt-5" disabled={disabled} loading={loading} onClick={() => inputRef.current?.click()} variant="primary">
        {!loading ? <Upload size={16} /> : null}
        {buttonLabel}
      </Button>
    </div>
  )
}
