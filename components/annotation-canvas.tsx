"use client"

import { useMemo } from "react"
import type { AnnotationTarget } from "@/lib/ai-schemas"
import { annotationTargetToRenderPlan } from "@/lib/annotation-geometry"

type AnnotationCanvasProps = {
  annotations: AnnotationTarget[]
  width?: number
  height?: number
  selectedAnnotationId?: string | null
  onSelectAnnotation?: (id: string) => void
}

export function AnnotationCanvas({
  annotations,
  width = 720,
  height = 930,
  selectedAnnotationId,
  onSelectAnnotation
}: AnnotationCanvasProps) {
  const plans = useMemo(
    () => annotations.map((annotation) => annotationTargetToRenderPlan(annotation, { width, height })).filter((plan) => plan !== null),
    [annotations, height, width]
  )

  return (
    <svg
      aria-label="Annotation canvas"
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
    >
      {plans.map((plan) => {
        const selected = selectedAnnotationId === plan.id
        const stroke = selected ? "#b91c1c" : "#dc2626"
        const strokeWidth = selected ? 5 : 3

        return (
          <g key={plan.id} onClick={() => onSelectAnnotation?.(plan.id)} className="cursor-pointer">
            {plan.shape === "underline" ? (
              <line
                x1={plan.targetBox.x}
                y1={plan.targetBox.y + plan.targetBox.height}
                x2={plan.targetBox.x + plan.targetBox.width}
                y2={plan.targetBox.y + plan.targetBox.height}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            ) : plan.shape === "cross_out" ? (
              <>
                <line
                  x1={plan.targetBox.x}
                  y1={plan.targetBox.y}
                  x2={plan.targetBox.x + plan.targetBox.width}
                  y2={plan.targetBox.y + plan.targetBox.height}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <line
                  x1={plan.targetBox.x + plan.targetBox.width}
                  y1={plan.targetBox.y}
                  x2={plan.targetBox.x}
                  y2={plan.targetBox.y + plan.targetBox.height}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <rect
                x={plan.targetBox.x}
                y={plan.targetBox.y}
                width={plan.targetBox.width}
                height={plan.targetBox.height}
                rx={8}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
            )}

            {plan.labelBox ? (
              <g>
                <line
                  x1={plan.targetBox.x + plan.targetBox.width}
                  y1={plan.targetBox.y}
                  x2={plan.labelBox.x}
                  y2={plan.labelBox.y + plan.labelBox.height / 2}
                  stroke={stroke}
                  strokeWidth={2}
                />
                <rect
                  x={plan.labelBox.x}
                  y={plan.labelBox.y}
                  width={plan.labelBox.width}
                  height={plan.labelBox.height}
                  rx={5}
                  fill="#fff7ed"
                  stroke={stroke}
                  strokeWidth={2}
                />
                <text x={plan.labelBox.x + 10} y={plan.labelBox.y + 20} fill="#991b1b" fontSize="16" fontWeight={700}>
                  {plan.label}
                </text>
              </g>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
