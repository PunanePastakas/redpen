import { cn } from "@/lib/classnames"

type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  value: T
  options: SegmentedControlOption<T>[]
  onChange: (value: T) => void
  "aria-label": string
  className?: string
}

export function SegmentedControl<T extends string>({ value, options, onChange, className, "aria-label": ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-grid grid-flow-col rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] p-1", className)} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          aria-checked={value === option.value}
          className={cn(
            "rounded-[var(--rp-radius-control)] px-3 py-1.5 text-sm font-semibold transition",
            value === option.value ? "bg-[var(--rp-primary)] text-white" : "text-[var(--rp-muted-strong)] hover:bg-[var(--rp-primary-wash)]"
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
