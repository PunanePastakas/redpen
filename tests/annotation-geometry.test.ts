import { describe, expect, it } from "vitest"
import { annotationTargetToRenderPlan } from "@/lib/annotation-geometry"
import { syntheticAnnotationTargets } from "@/lib/synthetic-demo"

describe("annotation geometry", () => {
  it("creates an Excalidraw-compatible render plan for accepted annotation targets", () => {
    const plan = annotationTargetToRenderPlan(syntheticAnnotationTargets[0]!, { width: 720, height: 930 })
    expect(plan).not.toBeNull()
    expect(plan?.targetBox.width).toBeGreaterThan(8)
    expect(plan?.shape).toBe("circle")
  })

  it("rejects annotation targets without usable geometry", () => {
    const plan = annotationTargetToRenderPlan(
      { ...syntheticAnnotationTargets[0]!, pageRef: { ...syntheticAnnotationTargets[0]!.pageRef, box: null } },
      { width: 720, height: 930 }
    )
    expect(plan).toBeNull()
  })
})
