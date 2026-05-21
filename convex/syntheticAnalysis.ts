export const GRADING_ANALYSIS_SCHEMA_VERSION = "2026-05-22.grading-analysis.v3"

export function syntheticAnalysisForConvex(feedbackLanguage: "et" | "en") {
  const et = feedbackLanguage === "et"

  return {
    schemaVersion: GRADING_ANALYSIS_SCHEMA_VERSION,
    studentName: {
      detectedName: "Ada Tamm",
      evidence: [{ pageNumber: 1, lineId: null, snippet: "Name field", box: null }]
    },
    transcription: {
      tasks: [
        {
          stableKey: "task-1-linear-equation",
          label: et ? "1. Lineaarvõrrand" : "1. Linear equation",
          likelyTaskNumber: "1",
          text: "\\(2x + 5 = 17\\)",
          pageRefs: [{ pageNumber: 1, lineId: "p1-l1", snippet: "2x + 5 = 17", box: null }],
          missingOrUnclearRegions: [],
        }
      ],
      unassignedText: null
    },
    tasks: [
      {
        stableKey: "task-1-linear-equation",
        label: et ? "1. Lineaarvõrrand" : "1. Linear equation",
        likelyTaskNumber: "1",
        sourceRefs: [{ pageNumber: 1, lineId: "p1-l1", snippet: null, box: null }],
        taskTranscript: "\\(2x + 5 = 17\\)",
        rubric: {
          maxPoints: 2,
          source: "guidance_document",
          evidence: [{ pageNumber: 1, lineId: null, snippet: "Task 1: 2 points", box: null }]
        },
        mistakeTypes: ["no_issue_found"],
        gradingRationale: et ? "Lahendus on korrektne." : "The solution is correct.",
        scoreBand: "full_points",
        suggestedPoints: { value: 2, max: 2, onlyIfRubricClear: true },
        feedbackDraft: et ? "Õige lahendus." : "Correct solution.",
        teacherReviewFlags: []
      }
    ],
    annotationTargets: [],
    generalFeedback: et ? "Töö on arusaadav ja korrektne." : "The work is clear and correct.",
    suggestedTotalPoints: 2,
    maxPoints: 2,
    suggestedGrade: null,
    reviewFlags: []
  }
}
