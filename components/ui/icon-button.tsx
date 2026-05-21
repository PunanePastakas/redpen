import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Button } from "@/components/ui/button"

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  "aria-label": string
  children: ReactNode
  title?: string
  variant?: "secondary" | "ghost" | "tool" | "danger" | "primary" | "ink"
}

export function IconButton({ children, variant = "tool", ...props }: IconButtonProps) {
  return (
    <Button size="icon" variant={variant} {...props}>
      {children}
    </Button>
  )
}
