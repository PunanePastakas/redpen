export const REDPEN_AI_SCHEMA_VERSION = "2026-05-20.redpen-analysis.v1"

export function syntheticAnalysisForConvex(feedbackLanguage: "et" | "en") {
  const et = feedbackLanguage === "et"

  return {
    schemaVersion: REDPEN_AI_SCHEMA_VERSION,
    language: {
      detectedInputLanguage: "et",
      requestedFeedbackLanguage: feedbackLanguage,
      confidence: 0.9
    },
    transcription: {
      overallConfidence: 0.84,
      pages: [
        {
          pageNumber: 1,
          overallConfidence: 0.84,
          missingOrUnclearRegions: [],
          lines: [
            {
              lineId: "p1-l1",
              rawText: "2x + 5 = 17",
              normalizedMath: "2x + 5 = 17",
              confidence: 0.96,
              pageRef: { pageNumber: 1, lineId: "p1-l1" }
            }
          ]
        }
      ]
    },
    studentIdentityDraft: {
      detectedName: "Ada Tamm",
      evidence: [{ pageNumber: 1, snippet: "Name field" }],
      confidence: 0.88,
      teacherMustConfirm: true
    },
    workMap: {
      tasks: [
        {
          stableKey: "task-1-linear-equation",
          label: et ? "1. Lineaarvõrrand" : "1. Linear equation",
          likelyTaskNumber: "1",
          pageRefs: [{ pageNumber: 1, lineId: "p1-l1" }],
          semanticEvidence: ["Correct isolation of x"],
          approximateCoordinates: [{ x: 0.1, y: 0.16, width: 0.38, height: 0.17 }],
          uncertainty: null
        }
      ],
      uncertainty: []
    },
    contextInterpretation: {
      usedContext: [],
      missingContext: ["No detailed rubric"],
      ambiguousContext: [],
      rubricPointsClear: false,
      summary: et ? "Punktid vajavad õpetaja kinnitust." : "Points require teacher confirmation."
    },
    taskDrafts: [
      {
        stableKey: "task-1-linear-equation",
        label: et ? "1. Lineaarvõrrand" : "1. Linear equation",
        sourceRefs: [{ pageNumber: 1, lineId: "p1-l1" }],
        mistakeTypes: ["no_issue_found"],
        processAnalysis: et ? "Lahendus on korrektne." : "The solution is correct.",
        suggestedPoints: { value: 2, max: 2, onlyIfRubricClear: true, confidence: 0.86 },
        feedbackDraft: et ? "Õige lahendus." : "Correct solution.",
        feedbackLanguage,
        teacherReviewFlags: []
      }
    ],
    annotationTargets: [],
    overallDraft: {
      summaryFeedback: et ? "Töö on arusaadav ja korrektne." : "The work is clear and correct.",
      suggestedTotalPoints: 2,
      maxPoints: 2,
      suggestedGrade: null,
      confidence: 0.8
    },
    reviewFlags: []
  }
}
