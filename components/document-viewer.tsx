"use client"

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, FileText, ImageIcon, ZoomIn, ZoomOut } from "lucide-react"
import type { AnnotationTarget } from "@/lib/ai-schemas"
import { AnnotationCanvas } from "@/components/annotation-canvas"

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
    <section className="min-w-0 rounded-lg border border-[#dbe2dc] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#dbe2dc] px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <button className="rounded-md p-2 text-[#526059] hover:bg-[#eef3ef]" title="Previous page" aria-label="Previous page" disabled>
            <ChevronLeft size={17} />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold">Leht 1 / 1</span>
          <button className="rounded-md p-2 text-[#526059] hover:bg-[#eef3ef]" title="Next page" aria-label="Next page" disabled>
            <ChevronRight size={17} />
          </button>
          {file ? <span className="truncate pl-2 text-sm text-[#647067]">{file.filename}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-md p-2 text-[#526059] hover:bg-[#eef3ef]"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => onZoomChange(Math.max(0.75, zoom - 0.1))}
          >
            <ZoomOut size={17} />
          </button>
          <span className="w-12 text-center text-xs font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            className="rounded-md p-2 text-[#526059] hover:bg-[#eef3ef]"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => onZoomChange(Math.min(1.35, zoom + 0.1))}
          >
            <ZoomIn size={17} />
          </button>
        </div>
      </div>

      <div className="workbench-scrollbar overflow-auto bg-[#e7ece7] p-4">
        {file?.url ? (
          <div className="mx-auto" style={{ width: `${Math.round(760 * zoom)}px`, maxWidth: "100%" }}>
            {file.fileKind === "image" || file.mimeType.startsWith("image/") ? (
              <div className="relative bg-white shadow-sm">
                <img className="block h-auto w-full" src={file.url} alt={file.filename} />
                <AnnotationCanvas annotations={annotations} selectedAnnotationId={selectedAnnotationId} onSelectAnnotation={onSelectAnnotation} />
              </div>
            ) : file.fileKind === "pdf" || file.mimeType === "application/pdf" ? (
              <iframe className="h-[860px] w-full rounded-md border border-[#cbd5ce] bg-white" title={file.filename} src={file.url} />
            ) : (
              <div className="rounded-md border border-[#cbd5ce] bg-white p-8 text-center">
                <FileText className="mx-auto text-[#526059]" aria-hidden="true" size={36} />
                <p className="mt-3 font-semibold">{file.filename}</p>
                <a className="mt-4 inline-flex rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white" href={file.url} target="_blank" rel="noreferrer">
                  Ava fail
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center rounded-md border border-dashed border-[#a7b4aa] bg-white p-8 text-center">
            <ImageIcon className="text-[#526059]" aria-hidden="true" size={40} />
            <h2 className="mt-4 text-xl font-semibold">Töö faili pole valitud</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#647067]">
              Vali üles laaditud töö või lisa esimene töö fail, et siia ilmuks tegelik eelvaade.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
