"use client"

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, FileText, ImageIcon, ZoomIn, ZoomOut } from "lucide-react"
import type { AnnotationTarget } from "@/lib/ai-schemas"
import { AnnotationCanvas } from "@/components/annotation-canvas"
import { EmptyState } from "@/components/ui/empty-state"
import { IconButton } from "@/components/ui/icon-button"
import { Panel } from "@/components/ui/panel"
import { Toolbar, ToolbarGroup } from "@/components/ui/toolbar"

export type PreviewUpload = {
  filename: string
  fileKind: "image" | "pdf" | "text" | "unknown"
  mimeType: string
  url: string | null
}

type DocumentViewerProps = {
  file?: PreviewUpload | null
  annotations: AnnotationTarget[]
  selectedAnnotationId?: string | null
  onSelectAnnotation?: (id: string) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function DocumentViewer({ file, annotations, selectedAnnotationId, onSelectAnnotation, zoom, onZoomChange }: DocumentViewerProps) {
  return (
    <Panel className="min-w-0 overflow-hidden p-0" variant="paper">
      <Toolbar className="justify-between">
        <ToolbarGroup className="min-w-0">
          <IconButton title="Previous page" aria-label="Previous page" disabled>
            <ChevronLeft size={17} />
          </IconButton>
          <span className="min-w-20 text-center text-sm font-semibold">Leht 1 / 1</span>
          <IconButton title="Next page" aria-label="Next page" disabled>
            <ChevronRight size={17} />
          </IconButton>
          {file ? <span className="truncate pl-2 text-sm text-[var(--rp-muted)]">{file.filename}</span> : null}
        </ToolbarGroup>
        <ToolbarGroup>
          <IconButton
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => onZoomChange(Math.max(0.75, zoom - 0.1))}
          >
            <ZoomOut size={17} />
          </IconButton>
          <span className="w-12 text-center text-xs font-semibold">{Math.round(zoom * 100)}%</span>
          <IconButton
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => onZoomChange(Math.min(1.35, zoom + 0.1))}
          >
            <ZoomIn size={17} />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>

      <div className="workbench-scrollbar overflow-auto bg-[var(--rp-paper-warm)] p-4">
        {file?.url ? (
          <div className="mx-auto" style={{ width: `${Math.round(760 * zoom)}px`, maxWidth: "100%" }}>
            {file.fileKind === "image" || file.mimeType.startsWith("image/") ? (
              <div className="relative border border-[var(--rp-ink)] bg-[var(--rp-surface)] shadow-[var(--rp-shadow-ink-soft)]">
                <img className="block h-auto w-full" src={file.url} alt={file.filename} />
                <AnnotationCanvas annotations={annotations} selectedAnnotationId={selectedAnnotationId} onSelectAnnotation={onSelectAnnotation} />
              </div>
            ) : file.fileKind === "pdf" || file.mimeType === "application/pdf" ? (
              <iframe className="h-[860px] w-full rounded-[var(--rp-radius-control)] border border-[var(--rp-ink)] bg-[var(--rp-surface)]" title={file.filename} src={file.url} />
            ) : (
              <div className="rounded-[var(--rp-radius-panel)] border border-[var(--rp-ink)] bg-[var(--rp-surface)] p-8 text-center shadow-[var(--rp-shadow-ink-soft)]">
                <FileText className="mx-auto text-[var(--rp-muted-strong)]" aria-hidden="true" size={36} />
                <p className="mt-3 font-semibold">{file.filename}</p>
                <a className="mt-4 inline-flex min-h-10 items-center rounded-[var(--rp-radius-control)] border border-[var(--rp-ink)] bg-[var(--rp-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_var(--rp-ink)] hover:bg-[var(--rp-primary-strong)]" href={file.url} target="_blank" rel="noreferrer">
                  Ava fail
                </a>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            body="Vali üles laaditud töö või lisa esimene töö fail, et siia ilmuks tegelik eelvaade."
            className="mx-auto min-h-[520px] max-w-xl bg-[var(--rp-surface)]"
            icon={<ImageIcon aria-hidden="true" size={40} />}
            title="Töö faili pole valitud"
          />
        )}
      </div>
    </Panel>
  )
}
