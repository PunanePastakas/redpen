import type { AnnotationTarget, RedPenAnalysis } from "@/lib/ai-schemas"
import { REDPEN_AI_SCHEMA_VERSION } from "@/lib/ai-schemas"

export const syntheticStudents = [
  {
    id: "student-ada",
    displayName: "Ada Tamm",
    externalRef: "7A-01",
    preferredLanguage: "et",
    accessStatus: "invite_ready"
  },
  {
    id: "student-mart",
    displayName: "Mart Kask",
    externalRef: "7A-02",
    preferredLanguage: "et",
    accessStatus: "not_invited"
  },
  {
    id: "student-liis",
    displayName: "Liis Saar",
    externalRef: "7A-03",
    preferredLanguage: "en",
    accessStatus: "invite_ready"
  }
]

export const syntheticAnalysis: RedPenAnalysis = {
  schemaVersion: REDPEN_AI_SCHEMA_VERSION,
  language: {
    detectedInputLanguage: "et",
    requestedFeedbackLanguage: "et",
    confidence: 0.91,
    notes: "Student work is mostly mathematical notation with Estonian labels."
  },
  transcription: {
    overallConfidence: 0.84,
    pages: [
      {
        pageNumber: 1,
        pageLabel: "Leht 1",
        overallConfidence: 0.84,
        missingOrUnclearRegions: [
          {
            pageNumber: 1,
            snippet: "Last transformation line is faint.",
            box: { x: 0.12, y: 0.61, width: 0.34, height: 0.08 }
          }
        ],
        lines: [
          {
            lineId: "p1-l1",
            rawText: "1) 2x + 5 = 17",
            normalizedMath: "2x + 5 = 17",
            confidence: 0.96,
            pageRef: { pageNumber: 1, lineId: "p1-l1", box: { x: 0.12, y: 0.18, width: 0.28, height: 0.05 } }
          },
          {
            lineId: "p1-l2",
            rawText: "2x = 12, x = 6",
            normalizedMath: "2x = 12; x = 6",
            confidence: 0.94,
            pageRef: { pageNumber: 1, lineId: "p1-l2", box: { x: 0.12, y: 0.25, width: 0.25, height: 0.05 } }
          },
          {
            lineId: "p1-l3",
            rawText: "2) (x + 3)^2 = x^2 + 6x + 6",
            normalizedMath: "(x + 3)^2 = x^2 + 6x + 6",
            confidence: 0.82,
            pageRef: { pageNumber: 1, lineId: "p1-l3", box: { x: 0.12, y: 0.43, width: 0.45, height: 0.06 } }
          }
        ]
      }
    ]
  },
  studentIdentityDraft: {
    detectedName: "Ada Tamm",
    evidence: [{ pageNumber: 1, snippet: "Name field upper left", box: { x: 0.11, y: 0.08, width: 0.18, height: 0.05 } }],
    confidence: 0.88,
    teacherMustConfirm: true
  },
  workMap: {
    tasks: [
      {
        stableKey: "task-1-linear-equation",
        label: "1. Lineaarvõrrand",
        likelyTaskNumber: "1",
        pageRefs: [{ pageNumber: 1, lineId: "p1-l1", box: { x: 0.1, y: 0.16, width: 0.35, height: 0.16 } }],
        semanticEvidence: ["Equation isolated correctly", "Division by 2 shown"],
        approximateCoordinates: [{ x: 0.1, y: 0.16, width: 0.38, height: 0.17 }],
        uncertainty: null
      },
      {
        stableKey: "task-2-binomial",
        label: "2. Ruutvalem",
        likelyTaskNumber: "2",
        pageRefs: [{ pageNumber: 1, lineId: "p1-l3", box: { x: 0.1, y: 0.4, width: 0.52, height: 0.18 } }],
        semanticEvidence: ["Expansion has correct middle term", "Constant term should be 9, not 6"],
        approximateCoordinates: [{ x: 0.1, y: 0.4, width: 0.55, height: 0.18 }],
        uncertainty: "The last digit is slightly faint but likely 6."
      }
    ],
    uncertainty: ["Rubric was not attached; point suggestions are draft only."]
  },
  contextInterpretation: {
    usedContext: ["Teacher note: two algebra tasks, 2 points each"],
    missingContext: ["No detailed marking rubric"],
    ambiguousContext: ["Partial credit for correct method is not specified"],
    rubricPointsClear: false,
    summary: "The context supports task grouping, but point deductions need teacher judgment."
  },
  taskDrafts: [
    {
      stableKey: "task-1-linear-equation",
      label: "1. Lineaarvõrrand",
      sourceRefs: [{ pageNumber: 1, lineId: "p1-l2", box: { x: 0.12, y: 0.25, width: 0.25, height: 0.05 } }],
      mistakeTypes: ["no_issue_found"],
      processAnalysis: "The equation is solved correctly and the final value x = 6 follows from 2x = 12.",
      suggestedPoints: { value: 2, max: 2, onlyIfRubricClear: true, confidence: 0.86 },
      feedbackDraft: "Õige lahendus. Võrrand on korrektselt teisendatud ja vastus on selge.",
      feedbackLanguage: "et",
      teacherReviewFlags: []
    },
    {
      stableKey: "task-2-binomial",
      label: "2. Ruutvalem",
      sourceRefs: [{ pageNumber: 1, lineId: "p1-l3", box: { x: 0.12, y: 0.43, width: 0.45, height: 0.06 } }],
      mistakeTypes: ["formula_misuse"],
      processAnalysis: "The middle term 6x is correct, but the constant term should be 9 because 3^2 = 9.",
      suggestedPoints: { value: 1, max: 2, onlyIfRubricClear: false, confidence: 0.72 },
      feedbackDraft: "Hea algus: keskmine liige on õige. Kontrolli ruutliikme valemit lõpuni, sest 3² annab 9, mitte 6.",
      feedbackLanguage: "et",
      teacherReviewFlags: ["Rubric missing; confirm partial credit manually."]
    }
  ],
  annotationTargets: [
    {
      id: "annotation-1",
      taskStableKey: "task-2-binomial",
      shape: "circle",
      label: "3² = 9",
      semanticEvidence: "Constant term in binomial expansion is written as 6.",
      pageRef: { pageNumber: 1, lineId: "p1-l3", box: { x: 0.47, y: 0.43, width: 0.08, height: 0.05 } },
      confidence: 0.78,
      selfCheck: {
        targetOnStudentWork: true,
        targetMatchesFeedback: true,
        labelClearOfTargetMath: true,
        boxInsidePage: true
      },
      rejectionReason: null
    }
  ],
  overallDraft: {
    summaryFeedback: "Töö on üldiselt arusaadav. Esimene ülesanne on korrektne; teises ülesandes vaata ruutvalemi vabaliige uuesti üle.",
    suggestedTotalPoints: 3,
    maxPoints: 4,
    suggestedGrade: null,
    confidence: 0.78
  },
  reviewFlags: ["mismatched_rubric", "points_uncertain"]
}

export type SyntheticTaskReview = {
  stableKey: string
  status: "needs_review" | "accepted" | "edited" | "rejected" | "manual" | "confirmed"
  feedbackConfirmed: string
  pointsConfirmed: number | null
}

export const syntheticTaskReviews: SyntheticTaskReview[] = syntheticAnalysis.taskDrafts.map((draft) => ({
  stableKey: draft.stableKey,
  status: "needs_review",
  feedbackConfirmed: draft.feedbackDraft,
  pointsConfirmed: draft.suggestedPoints.value
}))

export const syntheticAnnotationTargets: AnnotationTarget[] = syntheticAnalysis.annotationTargets

export const syntheticSharedResult = {
  token: "demo-share-token",
  tokenRecord: {
    tokenHash: "c43aa9b23fef3c142def8cf2e0a0c316444165a035833e6349c22843fc9a9d70",
    studentId: "student-ada",
    status: "active" as const,
    expiresAt: "2099-01-01T00:00:00.000Z"
  },
  result: {
    studentId: "student-ada",
    status: "shared" as const,
    testTitle: "Algebra kontrolltöö",
    teacherName: "Õpetaja Demo",
    confirmedAt: "2026-05-21 10:30",
    finalFeedback:
      "Esimene ülesanne on lahendatud õigesti. Teises ülesandes on mõttekäik peaaegu õige, kuid kontrolli ruutvalemi vabaliiget: 3² = 9.",
    totalPoints: 3,
    maxPoints: 4,
    grade: "B",
    showPoints: true,
    showGrade: false,
    annotations: [
      {
        id: "annotation-1",
        label: "3² = 9",
        evidence: "Ruutvalemi vabaliige vajab parandust."
      }
    ]
  }
}
