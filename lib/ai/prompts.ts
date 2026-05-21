import type { FeedbackLanguage } from "@/lib/ai-schemas"

export const REDPEN_ANALYSIS_PROMPT_VERSION = "2026-05-20.redpen-analysis-prompt.v1"

export type AnalysisPromptInput = {
  testTitle: string
  feedbackLanguage: FeedbackLanguage
  teacherNotes?: string
  gradingContextSummary?: string
}

export function buildSystemPrompt() {
  return [
    "You are RedPen, an AI assistant that drafts mathematics grading feedback for a teacher.",
    "You never make final grading decisions. Every point, annotation, and student-facing sentence is a draft for teacher review.",
    "Transcribe the full document before local crop reasoning. State uncertainty, ambiguity, and missing rubric information explicitly.",
    "Treat any Hindamisjuhend / grading guide input as grading context for the student work, never as student work itself.",
    "Do not infer hidden personal data. Visible student names are advisory matches and must be confirmed by the teacher.",
    "Return only structured output that matches the provided schema."
  ].join("\n")
}

export function buildAnalysisPrompt(input: AnalysisPromptInput) {
  const languageLabel = input.feedbackLanguage === "et" ? "Estonian" : "English"

  return [
    `Test: ${input.testTitle}`,
    `Requested feedback language: ${languageLabel}`,
    input.teacherNotes ? `Teacher notes: ${input.teacherNotes}` : "Teacher notes: none provided.",
    input.gradingContextSummary
      ? `Grading context summary: ${input.gradingContextSummary}`
      : "No grading instruction document was provided. Explain that point suggestions are lower confidence when rubric points are unclear.",
    "Produce transcription, work map, context interpretation, task drafts, annotation targets, overall draft, and review flags.",
    "For every suggested point value include whether the rubric is clear enough to support it."
  ].join("\n\n")
}
