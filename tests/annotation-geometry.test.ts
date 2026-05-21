import { describe, expect, it } from "vitest"
import { annotationTargetToRenderPlan } from "@/lib/annotation-geometry"
import { syntheticAnnotationTargets } from "@/lib/synthetic-demo"

describe("annotation geometry", () => {
  it("creates an Excalidraw-compatible render plan for accepted annotation targets", () => {
    const plan = annotationTargetToRenderPlan(syntheticAnnotationTargets[0]!, { width: 720, height: 930 })
    expect(plan).not.toBeNull()
    expect(plan?.targetBox.width).toBeGreaterThan(8)
    expect(plan?.labelBox).not.toBeNull()
  })

  it("rejects low-confidence annotation targets", () => {
    const plan = annotationTargetToRenderPlan({ ...syntheticAnnotationTargets[0]!, confidence: 0.2 }, { width: 720, height: 930 })
    expect(plan).toBeNull()
  })
})
