import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/classnames"
import { fieldControlClassName } from "@/components/ui/field"

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldControlClassName, className)} {...props}>
      {children}
    </select>
  )
}
