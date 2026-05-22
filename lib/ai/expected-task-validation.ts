import type { ExpectedTaskGradingAnalysis, ExpectedTaskModelTask } from "@/lib/ai/dynamic-analysis-schema"
import type { GradingAnalysis } from "@/lib/ai-schemas"

export class ExpectedTaskValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Expected task analysis did not match the guide task model: ${issues.join("; ")}`)
    this.name = "ExpectedTaskValidationError"
  }
}

export function validateExpectedTaskAnalysis(
  analysis: ExpectedTaskGradingAnalysis,
  expectedTasks: ExpectedTaskModelTask[]
) {
  const issues = expectedTaskAnalysisIssues(analysis, expectedTasks)
  if (issues.length > 0) {
    throw new ExpectedTaskValidationError(issues)
  }
}

export function expectedTaskAnalysisIssues(
  analysis: ExpectedTaskGradingAnalysis,
  expectedTasks: ExpectedTaskModelTask[]
) {
  const issues: string[] = []
  const expectedKeys = expectedTasks.map((task) => task.stableKey)
  const transcriptionKeys = Object.keys(analysis.transcription.tasksByStableKey)
  const gradingKeys = Object.keys(analysis.tasksByStableKey)

  compareKeySets("transcription.tasksByStableKey", transcriptionKeys, expectedKeys, issues)
  compareKeySets("tasksByStableKey", gradingKeys, expectedKeys, issues)

  const expectedByKey = new Map(expectedTasks.map((task) => [task.stableKey, task]))
  for (const key of expectedKeys) {
    const expected = expectedByKey.get(key)!
    const transcript = analysis.transcription.tasksByStableKey[key]
    const draft = analysis.tasksByStableKey[key]
    if (!transcript || !draft) continue

    if (transcript.label !== expected.label) issues.push(`${key} transcript label changed`)
    if (draft.label !== expected.label) issues.push(`${key} draft label changed`)
    if ((transcript.likelyTaskNumber ?? null) !== (expected.likelyTaskNumber ?? null)) issues.push(`${key} transcript task number changed`)
    if ((draft.likelyTaskNumber ?? null) !== (expected.likelyTaskNumber ?? null)) issues.push(`${key} draft task number changed`)
    if ((draft.rubric.maxPoints ?? null) !== (expected.maxPoints ?? null)) issues.push(`${key} rubric max points changed`)
    if ((draft.suggestedPoints.max ?? null) !== (expected.maxPoints ?? null)) issues.push(`${key} suggested max points changed`)
    if (draft.rubric.source !== "guidance_document") issues.push(`${key} rubric source is not guidance_document`)
    if (draft.taskEvidenceStatus === "not_visible_in_upload" && !hasTaskMissingSignal(draft)) {
      issues.push(`${key} not-visible task is missing a review signal`)
    }
  }

  for (const target of analysis.annotationTargets) {
    if (target.taskStableKey !== null && !expectedByKey.has(target.taskStableKey)) {
      issues.push(`annotation ${target.id} references unexpected task ${target.taskStableKey}`)
    }
  }

  const knownMaxPoints = expectedTasks.map((task) => task.maxPoints ?? null)
  if (knownMaxPoints.every((value): value is number => typeof value === "number")) {
    const expectedTotal = knownMaxPoints.reduce((sum, value) => sum + value, 0)
    if (analysis.maxPoints !== expectedTotal) {
      issues.push(`top-level maxPoints ${analysis.maxPoints ?? "null"} does not equal expected ${expectedTotal}`)
    }
  }

  return issues
}

export function assertGradingAnalysisMatchesExpectedTasks(
  analysis: GradingAnalysis,
  expectedTasks: ExpectedTaskModelTask[]
) {
  const issues: string[] = []
  const expectedKeys = expectedTasks.map((task) => task.stableKey)
  compareKeySets("transcription.tasks", analysis.transcription.tasks.map((task) => task.stableKey), expectedKeys, issues)
  compareKeySets("tasks", analysis.tasks.map((task) => task.stableKey), expectedKeys, issues)
  if (issues.length > 0) throw new ExpectedTaskValidationError(issues)
}

function compareKeySets(label: string, actualKeys: string[], expectedKeys: string[], issues: string[]) {
  const actual = new Set(actualKeys)
  const expected = new Set(expectedKeys)
  const missing = expectedKeys.filter((key) => !actual.has(key))
  const unexpected = actualKeys.filter((key) => !expected.has(key))
  if (missing.length > 0) issues.push(`${label} missing ${missing.join(", ")}`)
  if (unexpected.length > 0) issues.push(`${label} has unexpected ${unexpected.join(", ")}`)
}

function hasTaskMissingSignal(draft: GradingAnalysis["tasks"][number]) {
  return (
    draft.scoreBand === "unclear" ||
    draft.teacherReviewFlags.some((flag) => flag.toLowerCase().includes("not visible") || flag.toLowerCase().includes("missing")) ||
    draft.suggestedPoints.value === null
  )
}
