import { describe, expect, it } from "vitest"
import { GradingAnalysisJsonSchema, GradingAnalysisSchema } from "@/lib/ai-schemas"
import { syntheticAnalysis } from "@/lib/synthetic-demo"

describe("GradingAnalysisSchema", () => {
  it("generates an OpenAI strict-compatible JSON schema", () => {
    expect(findObjectsWithOptionalProperties(GradingAnalysisJsonSchema)).toEqual([])
  })

  it("parses the synthetic full-document analysis fixture", () => {
    expect(GradingAnalysisSchema.parse(syntheticAnalysis)).toEqual(syntheticAnalysis)
  })

  it("rejects malformed output without a schema version", () => {
    const malformed = { ...syntheticAnalysis, schemaVersion: undefined }
    expect(() => GradingAnalysisSchema.parse(malformed)).toThrow()
  })

  it("supports rubric uncertainty flags", () => {
    const parsed = GradingAnalysisSchema.parse(syntheticAnalysis)
    expect(parsed.reviewFlags).toContain("points_uncertain")
    expect(parsed.tasks[1]?.suggestedPoints.onlyIfRubricClear).toBe(false)
  })

  it("carries guidance-derived max points and task outcome bands", () => {
    const parsed = GradingAnalysisSchema.parse(syntheticAnalysis)
    expect(parsed.tasks[0]?.rubric).toMatchObject({
      maxPoints: 2,
      source: "guidance_document"
    })
    expect(parsed.tasks[0]?.suggestedPoints.max).toBe(parsed.tasks[0]?.rubric.maxPoints)
    expect(parsed.tasks[0]?.scoreBand).toBe("full_points")
    expect(parsed.tasks[1]?.scoreBand).toBe("minor_mistakes")
  })

  it("uses task-wise transcript blocks instead of line-wise output", () => {
    const parsed = GradingAnalysisSchema.parse(syntheticAnalysis)
    expect(parsed.transcription.tasks[0]?.text).toContain("\\(2x + 5 = 17\\)")
    expect(parsed.tasks[0]?.taskTranscript).toContain("\\(x = 6\\)")
    expect("pages" in parsed.transcription).toBe(false)
  })
})

function findObjectsWithOptionalProperties(schema: unknown) {
  const failures: string[] = []

  walkSchema(schema, [], (node, path) => {
    if (node.type !== "object" || !isRecord(node.properties)) return

    const properties = Object.keys(node.properties)
    const required = Array.isArray(node.required) ? node.required : []
    const missing = properties.filter((property) => !required.includes(property))

    if (missing.length > 0) {
      failures.push(`${path.join(".") || "<root>"}: ${missing.join(", ")}`)
    }
  })

  return failures
}

function walkSchema(schema: unknown, path: string[], visit: (node: Record<string, unknown>, path: string[]) => void) {
  if (!isRecord(schema)) return

  visit(schema, path)

  for (const key of ["properties", "$defs", "definitions"]) {
    const children = schema[key]
    if (!isRecord(children)) continue

    for (const [name, child] of Object.entries(children)) {
      walkSchema(child, [...path, name], visit)
    }
  }

  const items = schema.items
  if (Array.isArray(items)) {
    items.forEach((item, index) => walkSchema(item, [...path, `items${index}`], visit))
  } else {
    walkSchema(items, [...path, "items"], visit)
  }

  for (const key of ["anyOf", "oneOf", "allOf"]) {
    const variants = schema[key]
    if (!Array.isArray(variants)) continue

    variants.forEach((variant, index) => walkSchema(variant, [...path, `${key}${index}`], visit))
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
