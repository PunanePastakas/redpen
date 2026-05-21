import { Check } from "lucide-react"
import { cn } from "@/lib/classnames"

type ProgressStep = {
  label: string
  state: "complete" | "current" | "pending"
}

type ProgressStepsProps = {
  steps: ProgressStep[]
  className?: string
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <ol className={cn("grid gap-2", className)}>
      {steps.map((step, index) => (
        <li className="flex items-center gap-2 text-sm" key={`${step.label}-${index}`}>
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-[var(--rp-radius-control)] border text-xs font-semibold",
              step.state === "complete" && "border-[var(--rp-success)] bg-[var(--rp-success-soft)] text-[var(--rp-success)]",
              step.state === "current" && "border-[var(--rp-primary)] bg-[var(--rp-primary)] text-white",
              step.state === "pending" && "border-[var(--rp-border)] bg-[var(--rp-surface)] text-[var(--rp-muted)]"
            )}
          >
            {step.state === "complete" ? <Check aria-hidden="true" size={14} /> : index + 1}
          </span>
          <span className={cn("font-semibold", step.state === "pending" ? "text-[var(--rp-muted)]" : "text-[var(--rp-text)]")}>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
