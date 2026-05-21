import { describe, expect, it } from "vitest"
import { RedPenAnalysisSchema } from "@/lib/ai-schemas"
import { syntheticAnalysis } from "@/lib/synthetic-demo"

describe("RedPenAnalysisSchema", () => {
  it("parses the synthetic full-document analysis fixture", () => {
    expect(RedPenAnalysisSchema.parse(syntheticAnalysis)).toEqual(syntheticAnalysis)
  })

  it("rejects malformed output without a schema version", () => {
    const malformed = { ...syntheticAnalysis, schemaVersion: undefined }
    expect(() => RedPenAnalysisSchema.parse(malformed)).toThrow()
  })

  it("supports missing rubric and uncertainty flags", () => {
    const parsed = RedPenAnalysisSchema.parse(syntheticAnalysis)
    expect(parsed.contextInterpretation.rubricPointsClear).toBe(false)
    expect(parsed.reviewFlags).toContain("mismatched_rubric")
    expect(parsed.taskDrafts[1]?.suggestedPoints.onlyIfRubricClear).toBe(false)
  })
})
