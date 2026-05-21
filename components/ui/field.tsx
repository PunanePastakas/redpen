import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/classnames"

type FieldProps = {
  label: ReactNode
  htmlFor?: string
  helper?: ReactNode
  children: ReactNode
  className?: string
}

export const fieldControlClassName =
  "w-full rounded-[var(--rp-radius-control)] border border-[var(--rp-border-strong)] bg-[var(--rp-surface)] px-3 py-2 text-sm text-[var(--rp-text)] outline-none transition focus:border-[var(--rp-primary)]"

export function Field({ label, htmlFor, helper, children, className }: FieldProps) {
  return (
    <label className={cn("block text-sm font-semibold text-[var(--rp-text)]", className)} htmlFor={htmlFor}>
      {label}
      <span className="mt-2 block">{children}</span>
      {helper ? <span className="mt-1 block text-xs font-normal leading-5 text-[var(--rp-muted)]">{helper}</span> : null}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControlClassName, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldControlClassName, "min-h-28 resize-y leading-6", className)} {...props} />
}
