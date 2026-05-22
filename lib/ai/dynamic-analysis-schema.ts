import { z } from "zod"
import {
  AnnotationTargetSchema,
  GRADING_ANALYSIS_SCHEMA_VERSION,
  GradingTaskSchema,
  GuideTaskModel,
  PageRef,
  PageRefSchema,
  ReviewFlagSchema,
  StudentNameDraftSchema,
  TaskTranscriptionSchema,
  type GradingAnalysis,
  type GradingTask
} from "@/lib/ai-schemas"
import { validateExpectedTaskAnalysis } from "@/lib/ai/expected-task-validation"

export const EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION = "2026-05-22.expected-task-grading-analysis.v1"

export type ExpectedTaskModelTask = {
  stableKey: string
  label: string
  likelyTaskNumber?: string | null
  maxPoints?: number | null
  criteria?: unknown
  sourceRefs?: PageRef[]
  extractionWarnings?: string[]
  source?: string
  order: number
}

export type ExpectedTaskGradingAnalysis = {
  schemaVersion: typeof EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION
  studentName: GradingAnalysis["studentName"]
  transcription: {
    tasksByStableKey: Record<string, GradingAnalysis["transcription"]["tasks"][number]>
    unassignedText: string | null
  }
  tasksByStableKey: Record<string, GradingTask>
  annotationTargets: GradingAnalysis["annotationTargets"]
  generalFeedback: string
  suggestedTotalPoints: number | null
  maxPoints: number | null
  suggestedGrade: string | null
  reviewFlags: GradingAnalysis["reviewFlags"]
}

export function normalizeGuideTaskModelTasks(model: GuideTaskModel): ExpectedTaskModelTask[] {
  return model.tasks
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((task, index) => ({
      stableKey: stableTaskKey(index),
      label: task.label,
      likelyTaskNumber: task.likelyTaskNumber,
      maxPoints: task.maxPoints,
      criteria: task.criteria,
      sourceRefs: task.sourceRefs,
      extractionWarnings: task.extractionWarnings,
      source: "guidance_document",
      order: index
    }))
}

export function taskModelEntriesFromGuideTaskModel(model: GuideTaskModel): ExpectedTaskModelTask[] {
  return normalizeGuideTaskModelTasks(model)
}

export function buildExpectedTaskAnalysisContract(expectedTasks: ExpectedTaskModelTask[]) {
  const orderedTasks = orderExpectedTasks(expectedTasks)
  const zodSchema = buildExpectedTaskAnalysisZodSchema(orderedTasks)

  return {
    name: "expected_task_grading_analysis",
    schemaVersion: EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION,
    expectedTasks: orderedTasks,
    zodSchema,
    jsonSchema: z.toJSONSchema(zodSchema, { target: "draft-7" }),
    parse(value: unknown): GradingAnalysis {
      const parsed = zodSchema.parse(value) as ExpectedTaskGradingAnalysis
      validateExpectedTaskAnalysis(parsed, orderedTasks)
      return expectedTaskAnalysisToGradingAnalysis(parsed, orderedTasks)
    }
  }
}

export function expectedTaskAnalysisToGradingAnalysis(
  analysis: ExpectedTaskGradingAnalysis,
  expectedTasks: ExpectedTaskModelTask[]
): GradingAnalysis {
  const orderedTasks = orderExpectedTasks(expectedTasks)
  validateExpectedTaskAnalysis(analysis, orderedTasks)

  return {
    schemaVersion: GRADING_ANALYSIS_SCHEMA_VERSION,
    studentName: analysis.studentName,
    transcription: {
      tasks: orderedTasks.map((task) => analysis.transcription.tasksByStableKey[task.stableKey]!),
      unassignedText: analysis.transcription.unassignedText
    },
    tasks: orderedTasks.map((task) => analysis.tasksByStableKey[task.stableKey]!),
    annotationTargets: analysis.annotationTargets,
    generalFeedback: analysis.generalFeedback,
    suggestedTotalPoints: analysis.suggestedTotalPoints,
    maxPoints: analysis.maxPoints,
    suggestedGrade: analysis.suggestedGrade,
    reviewFlags: analysis.reviewFlags
  }
}

export function orderExpectedTasks(expectedTasks: ExpectedTaskModelTask[]) {
  return expectedTasks.slice().sort((left, right) => left.order - right.order)
}

export function isTaskModelReadyForGuidedAnalysis(input: {
  taskModelStatus?: string
  taskModel?: ExpectedTaskModelTask[]
}) {
  return input.taskModelStatus === "ready" || (!input.taskModelStatus && Boolean(input.taskModel?.length))
}

export function stableTaskKey(index: number) {
  return `task-${String(index + 1).padStart(2, "0")}`
}

function buildExpectedTaskAnalysisZodSchema(expectedTasks: ExpectedTaskModelTask[]) {
  const transcriptionTasksByStableKey: Record<string, z.ZodType> = {}
  const tasksByStableKey: Record<string, z.ZodType> = {}

  for (const task of expectedTasks) {
    const likelyTaskNumberSchema = literalStringOrNull(task.likelyTaskNumber ?? null)
    const maxPointsSchema = literalNumberOrNull(task.maxPoints ?? null)

    transcriptionTasksByStableKey[task.stableKey] = TaskTranscriptionSchema.extend({
      stableKey: z.literal(task.stableKey),
      label: z.literal(task.label),
      likelyTaskNumber: likelyTaskNumberSchema
    })

    tasksByStableKey[task.stableKey] = GradingTaskSchema.extend({
      stableKey: z.literal(task.stableKey),
      label: z.literal(task.label),
      likelyTaskNumber: likelyTaskNumberSchema,
      rubric: z.object({
        maxPoints: maxPointsSchema,
        source: z.literal("guidance_document"),
        evidence: z.array(PageRefSchema)
      }),
      suggestedPoints: z.object({
        value: z.number().nullable(),
        max: maxPointsSchema,
        onlyIfRubricClear: z.boolean()
      })
    })
  }

  return z.object({
    schemaVersion: z.literal(EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION),
    studentName: StudentNameDraftSchema,
    transcription: z.object({
      tasksByStableKey: z.object(transcriptionTasksByStableKey),
      unassignedText: z.string().nullable()
    }),
    tasksByStableKey: z.object(tasksByStableKey),
    annotationTargets: z.array(AnnotationTargetSchema),
    generalFeedback: z.string(),
    suggestedTotalPoints: z.number().nullable(),
    maxPoints: z.number().nullable(),
    suggestedGrade: z.string().nullable(),
    reviewFlags: z.array(ReviewFlagSchema)
  })
}

function literalStringOrNull(value: string | null) {
  return value === null ? z.null() : z.literal(value)
}

function literalNumberOrNull(value: number | null) {
  return value === null ? z.null() : z.literal(value)
}
