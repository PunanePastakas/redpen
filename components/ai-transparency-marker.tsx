import { Bot, Info } from "lucide-react"
import { Notice } from "@/components/ui/notice"
import { StatusBadge } from "@/components/ui/status-badge"

type AITransparencyMarkerProps = {
  variant?: "banner" | "inline" | "badge"
  contentType?: string
}

export function AITransparencyMarker({ variant = "banner", contentType = "sisu" }: AITransparencyMarkerProps) {
  if (variant === "badge") {
    return (
      <StatusBadge
        className="rounded-[var(--rp-radius-control)]"
        icon={<Bot aria-hidden="true" size={13} />}
        title="See sisu on loodud tehisintellekti abil ja õpetaja peab selle kinnitama."
        tone="primary"
      >
        AI
      </StatusBadge>
    )
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--rp-muted)]">
        <Info aria-hidden="true" size={15} />
        AI loodud {contentType}; õpetaja kinnitab lõpliku sisu.
      </span>
    )
  }

  return (
    <Notice icon={<Bot aria-hidden="true" size={18} />} title={`AI loodud ${contentType}.`} variant="ai">
      See on töömustand ning võib olla ebatäpne. Õpetaja vastutab lõpliku tagasiside, punktide ja jagamise eest.
    </Notice>
  )
}
