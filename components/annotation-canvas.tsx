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
        const stroke = selected ? "var(--rp-correction-strong)" : "var(--rp-correction)"
        const strokeWidth = selected ? 5 : 3

        return (
          <g key={plan.id} onClick={() => onSelectAnnotation?.(plan.id)} className="cursor-pointer">
            {plan.shape === "cross_out" ? (
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
            ) : plan.shape === "check" ? (
              <polyline
                points={`${plan.targetBox.x + plan.targetBox.width * 0.15},${plan.targetBox.y + plan.targetBox.height * 0.55} ${plan.targetBox.x + plan.targetBox.width * 0.4},${plan.targetBox.y + plan.targetBox.height * 0.78} ${plan.targetBox.x + plan.targetBox.width * 0.85},${plan.targetBox.y + plan.targetBox.height * 0.22}`}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <ellipse
                cx={plan.targetBox.x + plan.targetBox.width / 2}
                cy={plan.targetBox.y + plan.targetBox.height / 2}
                rx={plan.targetBox.width / 2}
                ry={plan.targetBox.height / 2}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
