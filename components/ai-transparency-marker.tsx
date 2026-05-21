import { Bot, Info } from "lucide-react"

type AITransparencyMarkerProps = {
  variant?: "banner" | "inline" | "badge"
  contentType?: string
}

export function AITransparencyMarker({ variant = "banner", contentType = "sisu" }: AITransparencyMarkerProps) {
  if (variant === "badge") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded border border-[#c7d2cc] bg-[#f7faf8] px-2 py-1 text-xs font-medium text-[#526059]"
        title="See sisu on loodud tehisintellekti abil ja õpetaja peab selle kinnitama."
      >
        <Bot aria-hidden="true" size={13} />
        AI
      </span>
    )
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[#647067]">
        <Info aria-hidden="true" size={15} />
        AI loodud {contentType}; õpetaja kinnitab lõpliku sisu.
      </span>
    )
  }

  return (
    <div className="rounded-lg border border-[#b7dfd8] bg-[#effdfa] p-3 text-sm text-[#115e59]">
      <div className="flex items-start gap-2">
        <Bot aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        <p>
          <span className="font-semibold">AI loodud {contentType}.</span> See on töömustand ning võib olla ebatäpne.
          Õpetaja vastutab lõpliku tagasiside, punktide ja jagamise eest.
        </p>
      </div>
    </div>
  )
}
