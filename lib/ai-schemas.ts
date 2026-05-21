import { z } from "zod"

export const REDPEN_AI_SCHEMA_VERSION = "2026-05-20.redpen-analysis.v1"

export const LanguageCodeSchema = z.enum(["et", "en", "unknown"])
export const FeedbackLanguageSchema = z.enum(["et", "en"])
export const ConfidenceSchema = z.number().min(0).max(1)

export const NormalizedBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1)
})

export const PageRefSchema = z.object({
  pageNumber: z.number().int().positive(),
  lineId: z.string().optional(),
  snippet: z.string().optional(),
  box: NormalizedBoxSchema.optional()
})

export const LanguageMetadataSchema = z.object({
  detectedInputLanguage: LanguageCodeSchema,
  requestedFeedbackLanguage: FeedbackLanguageSchema,
  confidence: ConfidenceSchema,
  notes: z.string().optional()
})

export const TranscriptionLineSchema = z.object({
  lineId: z.string(),
  rawText: z.string(),
  normalizedMath: z.string().nullable(),
  confidence: ConfidenceSchema,
  pageRef: PageRefSchema
})

export const PageTranscriptionSchema = z.object({
  pageNumber: z.number().int().positive(),
  pageLabel: z.string().optional(),
  overallConfidence: ConfidenceSchema,
  lines: z.array(TranscriptionLineSchema),
  missingOrUnclearRegions: z.array(PageRefSchema)
})

export const StudentIdentityDraftSchema = z.object({
  detectedName: z.string().nullable(),
  evidence: z.array(PageRefSchema),
  confidence: ConfidenceSchema,
  teacherMustConfirm: z.boolean()
})

export const WorkMapTaskSchema = z.object({
  stableKey: z.string(),
  label: z.string(),
  likelyTaskNumber: z.string().nullable(),
  pageRefs: z.array(PageRefSchema),
  semanticEvidence: z.array(z.string()),
  approximateCoordinates: z.array(NormalizedBoxSchema),
  uncertainty: z.string().nullable()
})

export const ContextInterpretationSchema = z.object({
  usedContext: z.array(z.string()),
  missingContext: z.array(z.string()),
  ambiguousContext: z.array(z.string()),
  rubricPointsClear: z.boolean(),
  summary: z.string()
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

export const AnnotationTargetSchema = z.object({
  id: z.string(),
  taskStableKey: z.string().nullable(),
  shape: z.enum(["circle", "underline", "cross_out", "arrow_note", "check", "freehand"]),
  label: z.string(),
  semanticEvidence: z.string(),
  pageRef: PageRefSchema,
  confidence: ConfidenceSchema,
  selfCheck: z.object({
    targetOnStudentWork: z.boolean(),
    targetMatchesFeedback: z.boolean(),
    labelClearOfTargetMath: z.boolean(),
    boxInsidePage: z.boolean()
  }),
  rejectionReason: z.string().nullable()
})

export const TaskDraftSchema = z.object({
  stableKey: z.string(),
  label: z.string(),
  sourceRefs: z.array(PageRefSchema),
  mistakeTypes: z.array(MistakeTypeSchema),
  processAnalysis: z.string(),
  suggestedPoints: z.object({
    value: z.number().nullable(),
    max: z.number().nullable(),
    onlyIfRubricClear: z.boolean(),
    confidence: ConfidenceSchema
  }),
  feedbackDraft: z.string(),
  feedbackLanguage: FeedbackLanguageSchema,
  teacherReviewFlags: z.array(z.string())
})

export const OverallDraftSchema = z.object({
  summaryFeedback: z.string(),
  suggestedTotalPoints: z.number().nullable(),
  maxPoints: z.number().nullable(),
  suggestedGrade: z.string().nullable(),
  confidence: ConfidenceSchema
})

export const ReviewFlagSchema = z.enum([
  "unclear_handwriting",
  "missing_page",
  "mismatched_rubric",
  "language_uncertainty",
  "multiple_valid_solution_paths",
  "safety_privacy_warning",
  "student_name_uncertain",
  "points_uncertain"
])

export const RedPenAnalysisSchema = z.object({
  schemaVersion: z.literal(REDPEN_AI_SCHEMA_VERSION),
  language: LanguageMetadataSchema,
  transcription: z.object({
    pages: z.array(PageTranscriptionSchema),
    overallConfidence: ConfidenceSchema
  }),
  studentIdentityDraft: StudentIdentityDraftSchema,
  workMap: z.object({
    tasks: z.array(WorkMapTaskSchema),
    uncertainty: z.array(z.string())
  }),
  contextInterpretation: ContextInterpretationSchema,
  taskDrafts: z.array(TaskDraftSchema),
  annotationTargets: z.array(AnnotationTargetSchema),
  overallDraft: OverallDraftSchema,
  reviewFlags: z.array(ReviewFlagSchema)
})

export type LanguageCode = z.infer<typeof LanguageCodeSchema>
export type FeedbackLanguage = z.infer<typeof FeedbackLanguageSchema>
export type NormalizedBox = z.infer<typeof NormalizedBoxSchema>
export type PageRef = z.infer<typeof PageRefSchema>
export type AnnotationTarget = z.infer<typeof AnnotationTargetSchema>
export type TaskDraft = z.infer<typeof TaskDraftSchema>
export type RedPenAnalysis = z.infer<typeof RedPenAnalysisSchema>

export const RedPenAnalysisJsonSchema = z.toJSONSchema(RedPenAnalysisSchema, {
  target: "draft-7"
})

export function parseRedPenAnalysis(value: unknown): RedPenAnalysis {
  return RedPenAnalysisSchema.parse(value)
}
