import { z } from "zod"

export const GRADING_ANALYSIS_SCHEMA_VERSION = "2026-05-22.grading-analysis.v4"
export const GUIDE_TASK_MODEL_SCHEMA_VERSION = "2026-05-22.guide-task-model.v1"

export const FeedbackLanguageSchema = z.enum(["et", "en"])

export const NormalizedBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1)
})

export const PageRefSchema = z.object({
  pageNumber: z.number().int().positive(),
  lineId: z.string().nullable(),
  snippet: z.string().nullable(),
  box: NormalizedBoxSchema.nullable()
})

export const TaskTranscriptionSchema = z.object({
  stableKey: z.string(),
  label: z.string(),
  likelyTaskNumber: z.string().nullable(),
  text: z.string(),
  pageRefs: z.array(PageRefSchema),
  missingOrUnclearRegions: z.array(PageRefSchema)
})

export const StudentNameDraftSchema = z.object({
  detectedName: z.string().nullable(),
  evidence: z.array(PageRefSchema)
})

export const MistakeTypeSchema = z.enum([
  "arithmetic_slip",
  "sign_error",
  "formula_misuse",
  "invalid_transformation",
  "incomplete_work",
  "conceptual_error",
  "notation_issue",
  "unclear_handwriting",
  "no_issue_found",
  "unclear"
])

export const RubricPointSourceSchema = z.enum(["guidance_document", "teacher_notes", "not_found"])

export const TaskScoreBandSchema = z.enum(["full_points", "minor_mistakes", "major_mistakes", "not_attempted", "unclear"])
export const TaskEvidenceStatusSchema = z.enum(["visible", "not_visible_in_upload", "blank_or_not_attempted", "unclear"])

export const GradingTaskSchema = z.object({
  stableKey: z.string(),
  label: z.string(),
  likelyTaskNumber: z.string().nullable(),
  sourceRefs: z.array(PageRefSchema),
  taskTranscript: z.string(),
  rubric: z.object({
    maxPoints: z.number().nullable(),
    source: RubricPointSourceSchema,
    evidence: z.array(PageRefSchema)
  }),
  gradingRationale: z.string(),
  mistakeTypes: z.array(MistakeTypeSchema),
  scoreBand: TaskScoreBandSchema,
  taskEvidenceStatus: TaskEvidenceStatusSchema,
  suggestedPoints: z.object({
    value: z.number().nullable(),
    max: z.number().nullable(),
    onlyIfRubricClear: z.boolean()
  }),
  feedbackDraft: z.string(),
  teacherReviewFlags: z.array(z.string())
})

export const AnnotationTargetSchema = z.object({
  id: z.string(),
  taskStableKey: z.string().nullable(),
  shape: z.enum(["circle", "check", "cross_out"]),
  pageRef: PageRefSchema,
  semanticEvidence: z.string(),
  rejectionReason: z.string().nullable()
})

export const ReviewFlagSchema = z.enum([
  "unclear_handwriting",
  "missing_page",
  "missing_rubric",
  "guide_mismatch",
  "multiple_valid_solution_paths",
  "safety_privacy_warning",
  "student_name_uncertain",
  "points_uncertain",
  "unclear_transcription"
])

export const GradingAnalysisSchema = z.object({
  schemaVersion: z.literal(GRADING_ANALYSIS_SCHEMA_VERSION),
  studentName: StudentNameDraftSchema,
  transcription: z.object({
    tasks: z.array(TaskTranscriptionSchema),
    unassignedText: z.string().nullable()
  }),
  tasks: z.array(GradingTaskSchema),
  annotationTargets: z.array(AnnotationTargetSchema),
  generalFeedback: z.string(),
  suggestedTotalPoints: z.number().nullable(),
  maxPoints: z.number().nullable(),
  suggestedGrade: z.string().nullable(),
  reviewFlags: z.array(ReviewFlagSchema)
})

export const GuideReviewFlagSchema = z.enum(["missing_rubric", "unclear_task_structure", "points_uncertain", "guide_mismatch"])

export const GuideTaskCriteriaSchema = z.object({
  description: z.string(),
  pointGuide: z.array(z.string()),
  solutionNotes: z.array(z.string())
})

export const GuideTaskSchema = z.object({
  stableKey: z.string(),
  label: z.string(),
  likelyTaskNumber: z.string().nullable(),
  maxPoints: z.number().nullable(),
  criteria: GuideTaskCriteriaSchema,
  sourceRefs: z.array(PageRefSchema),
  order: z.number().int().nonnegative(),
  extractionWarnings: z.array(z.string())
})

export const GuideTaskModelSchema = z.object({
  schemaVersion: z.literal(GUIDE_TASK_MODEL_SCHEMA_VERSION),
  sourceSummary: z.string(),
  tasks: z.array(GuideTaskSchema),
  totalMaxPoints: z.number().nullable(),
  reviewFlags: z.array(GuideReviewFlagSchema)
})

export type FeedbackLanguage = z.infer<typeof FeedbackLanguageSchema>
export type NormalizedBox = z.infer<typeof NormalizedBoxSchema>
export type PageRef = z.infer<typeof PageRefSchema>
export type AnnotationTarget = z.infer<typeof AnnotationTargetSchema>
export type GradingTask = z.infer<typeof GradingTaskSchema>
export type GradingAnalysis = z.infer<typeof GradingAnalysisSchema>
export type TaskEvidenceStatus = z.infer<typeof TaskEvidenceStatusSchema>
export type GuideTask = z.infer<typeof GuideTaskSchema>
export type GuideTaskModel = z.infer<typeof GuideTaskModelSchema>

export const GradingAnalysisJsonSchema = z.toJSONSchema(GradingAnalysisSchema, {
  target: "draft-7"
})

export const GuideTaskModelJsonSchema = z.toJSONSchema(GuideTaskModelSchema, {
  target: "draft-7"
})

export function parseGradingAnalysis(value: unknown): GradingAnalysis {
  return GradingAnalysisSchema.parse(value)
}

export function parseGuideTaskModel(value: unknown): GuideTaskModel {
  return GuideTaskModelSchema.parse(value)
}
