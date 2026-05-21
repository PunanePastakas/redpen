import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"

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
  const tone =
    status === "error"
      ? "danger"
      : status === "confirmed" || status === "shared" || status === "reviewed"
        ? "success"
        : status === "drafted" || status === "needs_review" || status === "transcribing" || status === "mapped"
          ? "warning"
          : "neutral"

  const Icon =
    status === "error"
      ? AlertTriangle
      : status === "confirmed" || status === "shared" || status === "reviewed"
        ? CheckCircle2
        : status === "drafted" || status === "transcribing" || status === "mapped"
        ? Loader2
        : Clock3

  return (
    <StatusBadge tone={tone} icon={<Icon aria-hidden="true" className={Icon === Loader2 ? "animate-spin" : undefined} size={13} />}>
      {labels[status]}
    </StatusBadge>
  )
}
