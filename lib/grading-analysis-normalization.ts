import type { GradingAnalysis } from "@/lib/ai-schemas"
import { hasInvalidMathSpans } from "@/lib/math-rendering"

export function normalizeGradingAnalysisMath(analysis: GradingAnalysis): GradingAnalysis {
  let sawInvalidMath = false

  const displayValues = [
    analysis.generalFeedback,
    analysis.transcription.unassignedText ?? "",
    ...analysis.transcription.tasks.map((task) => task.text),
    ...analysis.tasks.flatMap((task) => [task.taskTranscript, task.gradingRationale, task.feedbackDraft]),
    ...analysis.annotationTargets.map((target) => target.semanticEvidence)
  ]
  if (displayValues.some(hasInvalidMathSpans)) {
    sawInvalidMath = true
  }

  return {
    ...analysis,
    reviewFlags: sawInvalidMath && !analysis.reviewFlags.includes("unclear_transcription")
      ? [...analysis.reviewFlags, "unclear_transcription"]
      : analysis.reviewFlags
  }
}
