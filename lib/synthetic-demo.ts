import type { AnnotationTarget, GradingAnalysis } from "@/lib/ai-schemas"
import { GRADING_ANALYSIS_SCHEMA_VERSION } from "@/lib/ai-schemas"

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

export const syntheticAnalysis: GradingAnalysis = {
  schemaVersion: GRADING_ANALYSIS_SCHEMA_VERSION,
  studentName: {
    detectedName: "Ada Tamm",
    evidence: [{ pageNumber: 1, lineId: null, snippet: "Name field upper left", box: { x: 0.11, y: 0.08, width: 0.18, height: 0.05 } }]
  },
  transcription: {
    tasks: [
      {
        stableKey: "task-1-linear-equation",
        label: "1. Lineaarvõrrand",
        likelyTaskNumber: "1",
        text: "1) \\(2x + 5 = 17\\)\n\\(2x = 12\\), \\(x = 6\\)",
        pageRefs: [
          { pageNumber: 1, lineId: "p1-l1", snippet: "1) 2x + 5 = 17", box: { x: 0.12, y: 0.18, width: 0.28, height: 0.05 } },
          { pageNumber: 1, lineId: "p1-l2", snippet: "2x = 12, x = 6", box: { x: 0.12, y: 0.25, width: 0.25, height: 0.05 } }
        ],
        missingOrUnclearRegions: []
      },
      {
        stableKey: "task-2-binomial",
        label: "2. Ruutvalem",
        likelyTaskNumber: "2",
        text: "2) \\((x + 3)^2 = x^2 + 6x + 6\\)",
        pageRefs: [
          { pageNumber: 1, lineId: "p1-l3", snippet: "2) (x + 3)^2 = x^2 + 6x + 6", box: { x: 0.12, y: 0.43, width: 0.45, height: 0.06 } }
        ],
        missingOrUnclearRegions: [
          {
            pageNumber: 1,
            lineId: null,
            snippet: "Last transformation line is faint.",
            box: { x: 0.12, y: 0.61, width: 0.34, height: 0.08 }
          }
        ]
      }
    ],
    unassignedText: null
  },
  tasks: [
    {
      stableKey: "task-1-linear-equation",
      label: "1. Lineaarvõrrand",
      likelyTaskNumber: "1",
      sourceRefs: [{ pageNumber: 1, lineId: "p1-l2", snippet: null, box: { x: 0.12, y: 0.25, width: 0.25, height: 0.05 } }],
      taskTranscript: "1) \\(2x + 5 = 17\\)\n\\(2x = 12\\), \\(x = 6\\)",
      rubric: {
        maxPoints: 2,
        source: "guidance_document",
        evidence: [{ pageNumber: 1, lineId: null, snippet: "Ülesanne 1: 2 punkti", box: null }]
      },
      mistakeTypes: ["no_issue_found"],
      gradingRationale: "The equation is solved correctly and \\(x = 6\\) follows from \\(2x = 12\\).",
      scoreBand: "full_points",
      taskEvidenceStatus: "visible",
      suggestedPoints: { value: 2, max: 2, onlyIfRubricClear: true },
      feedbackDraft: "Õige lahendus. Võrrand on korrektselt teisendatud ja vastus \\(x = 6\\) on selge.",
      teacherReviewFlags: []
    },
    {
      stableKey: "task-2-binomial",
      label: "2. Ruutvalem",
      likelyTaskNumber: "2",
      sourceRefs: [{ pageNumber: 1, lineId: "p1-l3", snippet: null, box: { x: 0.12, y: 0.43, width: 0.45, height: 0.06 } }],
      taskTranscript: "2) \\((x + 3)^2 = x^2 + 6x + 6\\)",
      rubric: {
        maxPoints: 2,
        source: "guidance_document",
        evidence: [{ pageNumber: 1, lineId: null, snippet: "Ülesanne 2: 2 punkti", box: null }]
      },
      mistakeTypes: ["formula_misuse"],
      gradingRationale: "The middle term \\(6x\\) is correct, but the constant term should be \\(9\\) because \\(3^2 = 9\\).",
      scoreBand: "minor_mistakes",
      taskEvidenceStatus: "visible",
      suggestedPoints: { value: 1, max: 2, onlyIfRubricClear: false },
      feedbackDraft: "Hea algus: keskmine liige on õige. Kontrolli ruutliikme valemit lõpuni, sest \\(3^2\\) annab \\(9\\), mitte \\(6\\).",
      teacherReviewFlags: ["Confirm partial credit manually."]
    }
  ],
  annotationTargets: [
    {
      id: "annotation-1",
      taskStableKey: "task-2-binomial",
      shape: "circle",
      semanticEvidence: "Constant term in binomial expansion is written as 6.",
      pageRef: { pageNumber: 1, lineId: "p1-l3", snippet: null, box: { x: 0.47, y: 0.43, width: 0.08, height: 0.05 } },
      rejectionReason: null
    }
  ],
  generalFeedback: "Töö on üldiselt arusaadav. Esimene ülesanne on korrektne; teises ülesandes vaata ruutvalemi vabaliige uuesti üle.",
  suggestedTotalPoints: 3,
  maxPoints: 4,
  suggestedGrade: null,
  reviewFlags: ["points_uncertain"]
}

export type SyntheticTaskReview = {
  stableKey: string
  status: "needs_review" | "accepted" | "edited" | "rejected" | "manual" | "confirmed"
  feedbackConfirmed: string
  pointsConfirmed: number | null
}

export const syntheticTaskReviews: SyntheticTaskReview[] = syntheticAnalysis.tasks.map((draft) => ({
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
