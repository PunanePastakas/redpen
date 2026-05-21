import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react"

type StatusPillProps = {
  status:
    | "uploaded"
    | "transcribing"
    | "mapped"
    | "drafted"
    | "needs_review"
    | "reviewed"
    | "confirmed"
    | "shared"
    | "archived"
    | "error"
}

const labels: Record<StatusPillProps["status"], string> = {
  uploaded: "Üles laaditud",
  transcribing: "Analüüsib",
  mapped: "Kaardistatud",
  drafted: "AI mustand",
  needs_review: "Vajab ülevaatust",
  reviewed: "Üle vaadatud",
  confirmed: "Kinnitatud",
  shared: "Jagatud",
  archived: "Arhiveeritud",
  error: "Tõrge"
}

export function StatusPill({ status }: StatusPillProps) {
  const color =
    status === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "confirmed" || status === "shared" || status === "reviewed"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "drafted" || status === "needs_review" || status === "transcribing" || status === "mapped"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-700"

  const Icon =
    status === "error"
      ? AlertTriangle
      : status === "confirmed" || status === "shared" || status === "reviewed"
        ? CheckCircle2
        : status === "drafted" || status === "transcribing" || status === "mapped"
          ? Loader2
          : Clock3

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${color}`}>
      <Icon aria-hidden="true" size={13} />
      {labels[status]}
    </span>
  )
}
