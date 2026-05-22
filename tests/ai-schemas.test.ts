import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { GradingAnalysisJsonSchema, GradingAnalysisSchema, GuideTaskModelJsonSchema, GuideTaskModelSchema } from "@/lib/ai-schemas"
import { buildExpectedTaskAnalysisContract, taskModelEntriesFromGuideTaskModel } from "@/lib/ai/dynamic-analysis-schema"
import { syntheticAnalysis } from "@/lib/synthetic-demo"
import { syntheticAnalysisForConvex, syntheticGuideTaskModelForConvex } from "@/convex/syntheticAnalysis"

describe("GradingAnalysisSchema", () => {
  it("generates an OpenAI strict-compatible JSON schema", () => {
    expect(findObjectsWithOptionalProperties(GradingAnalysisJsonSchema)).toEqual([])
  })

  it("generates a strict-compatible guide task model schema", () => {
    expect(findObjectsWithOptionalProperties(GuideTaskModelJsonSchema)).toEqual([])
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
    expect(parsed.tasks[0]?.taskEvidenceStatus).toBe("visible")
    expect(parsed.tasks[1]?.scoreBand).toBe("minor_mistakes")
  })

  it("uses task-wise transcript blocks instead of line-wise output", () => {
    const parsed = GradingAnalysisSchema.parse(syntheticAnalysis)
    expect(parsed.transcription.tasks[0]?.text).toContain("\\(2x + 5 = 17\\)")
    expect(parsed.tasks[0]?.taskTranscript).toContain("\\(x = 6\\)")
    expect("pages" in parsed.transcription).toBe(false)
  })
})

describe("GuideTaskModelSchema", () => {
  it("keeps the synthetic guide and partial work files available for smoke tests", () => {
    expect(existsSync("fixtures/synthetic/juhis.pdf")).toBe(true)
    expect(existsSync("fixtures/synthetic/1o.jpg")).toBe(true)
    expect(existsSync("fixtures/synthetic/1v.jpg")).toBe(true)
  })

  it("parses a four-task guide model fixture", () => {
    const parsed = GuideTaskModelSchema.parse(fourTaskGuideModelFixture())
    expect(parsed.tasks).toHaveLength(4)
    expect(parsed.tasks.map((task) => task.maxPoints)).toEqual([2, 2, 2, 2])
  })

  it("drives the mock guided analysis with the same four expected task keys", () => {
    const guideModel = GuideTaskModelSchema.parse(syntheticGuideTaskModelForConvex())
    const taskModel = taskModelEntriesFromGuideTaskModel(guideModel)
    const firstWork = GradingAnalysisSchema.parse(syntheticAnalysisForConvex("et", taskModel))
    const secondWork = GradingAnalysisSchema.parse(syntheticAnalysisForConvex("et", taskModel))

    expect(firstWork.tasks.map((task) => task.stableKey)).toEqual(["task-01", "task-02", "task-03", "task-04"])
    expect(secondWork.tasks.map((task) => task.stableKey)).toEqual(firstWork.tasks.map((task) => task.stableKey))
    expect(firstWork.tasks.slice(2).map((task) => task.taskEvidenceStatus)).toEqual(["not_visible_in_upload", "not_visible_in_upload"])
    expect(firstWork.tasks.slice(2).map((task) => task.suggestedPoints.value)).toEqual([null, null])
  })
})

describe("expected task analysis contract", () => {
  it("generates a strict-compatible dynamic schema from expected tasks", () => {
    const contract = buildExpectedTaskAnalysisContract(expectedTaskFixture())
    expect(findObjectsWithOptionalProperties(contract.jsonSchema)).toEqual([])
  })

  it("adapts keyed expected task output into ordered GradingAnalysis", () => {
    const contract = buildExpectedTaskAnalysisContract(expectedTaskFixture())
    const analysis = contract.parse(expectedTaskAnalysisFixture())
    expect(analysis.schemaVersion).toBe("2026-05-22.grading-analysis.v4")
    expect(analysis.tasks.map((task) => task.stableKey)).toEqual(["task-01", "task-02", "task-03", "task-04"])
    expect(analysis.tasks[2]?.taskEvidenceStatus).toBe("not_visible_in_upload")
    expect(analysis.tasks[2]?.suggestedPoints.value).toBeNull()
  })
})

function fourTaskGuideModelFixture() {
  return {
    schemaVersion: "2026-05-22.guide-task-model.v1",
    sourceSummary: "Synthetic guide with four exercises.",
    tasks: expectedTaskFixture().map((task) => ({
      stableKey: task.stableKey,
      label: task.label,
      likelyTaskNumber: task.likelyTaskNumber,
      maxPoints: task.maxPoints,
      criteria: {
        description: `Criteria for ${task.label}.`,
        pointGuide: ["1p method", "1p answer"],
        solutionNotes: [`Solution notes for ${task.label}.`]
      },
      sourceRefs: [{ pageNumber: 1, lineId: null, snippet: `${task.label}: 2p`, box: null }],
      order: task.order,
      extractionWarnings: []
    })),
    totalMaxPoints: 8,
    reviewFlags: []
  }
}

function expectedTaskFixture() {
  return [1, 2, 3, 4].map((taskNumber, index) => ({
    stableKey: `task-0${taskNumber}`,
    label: `Ülesanne ${taskNumber}`,
    likelyTaskNumber: `${taskNumber}`,
    maxPoints: 2,
    criteria: {
      description: `Criteria for task ${taskNumber}`,
      pointGuide: ["1p method", "1p answer"],
      solutionNotes: []
    },
    sourceRefs: [{ pageNumber: 1, lineId: null, snippet: `Ülesanne ${taskNumber}: 2 punkti`, box: null }],
    extractionWarnings: [],
    source: "guidance_document",
    order: index
  }))
}

function expectedTaskAnalysisFixture() {
  const tasks = expectedTaskFixture()
  const tasksByStableKey = Object.fromEntries(tasks.map((task, index) => {
    const visible = index < 2
    return [task.stableKey, {
      stableKey: task.stableKey,
      label: task.label,
      likelyTaskNumber: task.likelyTaskNumber,
      sourceRefs: visible ? [{ pageNumber: 1, lineId: `p1-l${index + 1}`, snippet: task.label, box: null }] : [],
      taskTranscript: visible ? `${task.label}: \\(x = ${index + 1}\\)` : "",
      rubric: {
        maxPoints: task.maxPoints,
        source: "guidance_document",
        evidence: [{ pageNumber: 1, lineId: null, snippet: `${task.label}: 2p`, box: null }]
      },
      gradingRationale: visible ? "Visible work can be assessed." : "This expected task is not visible in upload.",
      mistakeTypes: visible ? ["no_issue_found"] : ["unclear"],
      scoreBand: visible ? "full_points" : "unclear",
      taskEvidenceStatus: visible ? "visible" : "not_visible_in_upload",
      suggestedPoints: { value: visible ? 2 : null, max: task.maxPoints, onlyIfRubricClear: visible },
      feedbackDraft: visible ? "Correct." : "Teacher should check whether this task is missing from the uploaded pages.",
      teacherReviewFlags: visible ? [] : ["Expected task not visible in upload."]
    }]
  }))
  const transcriptionTasksByStableKey = Object.fromEntries(tasks.map((task, index) => {
    const visible = index < 2
    return [task.stableKey, {
      stableKey: task.stableKey,
      label: task.label,
      likelyTaskNumber: task.likelyTaskNumber,
      text: visible ? `${task.label}: \\(x = ${index + 1}\\)` : "",
      pageRefs: visible ? [{ pageNumber: 1, lineId: `p1-l${index + 1}`, snippet: task.label, box: null }] : [],
      missingOrUnclearRegions: visible ? [] : [{ pageNumber: 1, lineId: null, snippet: "Expected task not visible in upload.", box: null }]
    }]
  }))

  return {
    schemaVersion: "2026-05-22.expected-task-grading-analysis.v1",
    studentName: { detectedName: "Ada Tamm", evidence: [] },
    transcription: { tasksByStableKey: transcriptionTasksByStableKey, unassignedText: null },
    tasksByStableKey,
    annotationTargets: [],
    generalFeedback: "Visible tasks reviewed; later expected tasks are not visible.",
    suggestedTotalPoints: null,
    maxPoints: 8,
    suggestedGrade: null,
    reviewFlags: ["missing_page"]
  }
}

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
