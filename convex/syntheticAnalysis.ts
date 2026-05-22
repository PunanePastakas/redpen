export const GRADING_ANALYSIS_SCHEMA_VERSION = "2026-05-22.grading-analysis.v4"
export const GUIDE_TASK_MODEL_SCHEMA_VERSION = "2026-05-22.guide-task-model.v1"

type ExpectedSyntheticTask = {
  stableKey: string
  label: string
  likelyTaskNumber?: string | null
  maxPoints?: number | null
  order: number
}

export function syntheticGuideTaskModelForConvex() {
  return {
    schemaVersion: GUIDE_TASK_MODEL_SCHEMA_VERSION,
    sourceSummary: "Synthetic four-exercise grading guide for fixture smoke tests.",
    tasks: [1, 2, 3, 4].map((number, index) => ({
      stableKey: `task-${String(number).padStart(2, "0")}`,
      label: `Ülesanne ${number}`,
      likelyTaskNumber: `${number}`,
      maxPoints: 2,
      criteria: {
        description: `Synthetic grading criteria for exercise ${number}.`,
        pointGuide: ["1 point for correct method.", "1 point for correct final answer."],
        solutionNotes: [`Synthetic expected solution notes for exercise ${number}.`]
      },
      sourceRefs: [{ pageNumber: 1, lineId: null, snippet: `Ülesanne ${number}: 2 punkti`, box: null }],
      order: index,
      extractionWarnings: []
    })),
    totalMaxPoints: 8,
    reviewFlags: []
  }
}

export function syntheticAnalysisForConvex(feedbackLanguage: "et" | "en", expectedTasks: ExpectedSyntheticTask[] = []) {
  const et = feedbackLanguage === "et"
  if (expectedTasks.length > 0) {
    return syntheticExpectedTaskAnalysisForConvex(feedbackLanguage, expectedTasks)
  }

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
        taskEvidenceStatus: "visible",
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

function syntheticExpectedTaskAnalysisForConvex(feedbackLanguage: "et" | "en", expectedTasks: ExpectedSyntheticTask[]) {
  const et = feedbackLanguage === "et"
  const orderedTasks = expectedTasks.slice().sort((left, right) => left.order - right.order)
  const maxPoints = orderedTasks.every((task) => typeof task.maxPoints === "number")
    ? orderedTasks.reduce((sum, task) => sum + (task.maxPoints ?? 0), 0)
    : null
  const visibleTasks = new Set(orderedTasks.slice(0, 2).map((task) => task.stableKey))

  return {
    schemaVersion: GRADING_ANALYSIS_SCHEMA_VERSION,
    studentName: {
      detectedName: "Ada Tamm",
      evidence: [{ pageNumber: 1, lineId: null, snippet: "Name field", box: null }]
    },
    transcription: {
      tasks: orderedTasks.map((task, index) => ({
        stableKey: task.stableKey,
        label: task.label,
        likelyTaskNumber: task.likelyTaskNumber ?? null,
        text: visibleTasks.has(task.stableKey)
          ? `${task.label}: ${index === 0 ? "\\(2x + 5 = 17\\)" : "\\((x + 3)^2 = x^2 + 6x + 6\\)"}`
          : "",
        pageRefs: visibleTasks.has(task.stableKey)
          ? [{ pageNumber: 1, lineId: `p1-l${index + 1}`, snippet: task.label, box: null }]
          : [],
        missingOrUnclearRegions: visibleTasks.has(task.stableKey)
          ? []
          : [{ pageNumber: 1, lineId: null, snippet: "Expected task not visible in upload.", box: null }]
      })),
      unassignedText: null
    },
    tasks: orderedTasks.map((task, index) => {
      const visible = visibleTasks.has(task.stableKey)
      const firstTask = index === 0
      const max = task.maxPoints ?? null
      return {
        stableKey: task.stableKey,
        label: task.label,
        likelyTaskNumber: task.likelyTaskNumber ?? null,
        sourceRefs: visible ? [{ pageNumber: 1, lineId: `p1-l${index + 1}`, snippet: null, box: null }] : [],
        taskTranscript: visible
          ? `${task.label}: ${firstTask ? "\\(2x + 5 = 17\\)" : "\\((x + 3)^2 = x^2 + 6x + 6\\)"}`
          : "",
        rubric: {
          maxPoints: max,
          source: "guidance_document",
          evidence: [{ pageNumber: 1, lineId: null, snippet: `${task.label}: ${max ?? "?"} punkti`, box: null }]
        },
        mistakeTypes: visible ? [firstTask ? "no_issue_found" : "formula_misuse"] : ["unclear"],
        gradingRationale: visible
          ? firstTask
            ? (et ? "Lahendus on korrektne." : "The solution is correct.")
            : (et ? "Vabaliige vajab kontrollimist." : "The constant term needs checking.")
          : (et ? "See ülesanne ei ole üleslaaditud töö lehtedel nähtav." : "This expected task is not visible in the uploaded pages."),
        scoreBand: visible ? (firstTask ? "full_points" : "minor_mistakes") : "unclear",
        taskEvidenceStatus: visible ? "visible" : "not_visible_in_upload",
        suggestedPoints: {
          value: visible ? (firstTask ? max : max === null ? null : Math.max(0, max - 1)) : null,
          max,
          onlyIfRubricClear: Boolean(visible && max !== null)
        },
        feedbackDraft: visible
          ? firstTask
            ? (et ? "Õige lahendus." : "Correct solution.")
            : (et ? "Hea algus, kontrolli vabaliiget." : "Good start; check the constant term.")
          : (et ? "Õpetaja peab kontrollima, kas ülesanne puudub üleslaaditud lehtedelt." : "Teacher should check whether this task is missing from the uploaded pages."),
        teacherReviewFlags: visible ? [] : ["Expected task not visible in upload."]
      }
    }),
    annotationTargets: [],
    generalFeedback: et
      ? "Esimesed nähtavad ülesanded on läbi vaadatud. Osa juhendi ülesandeid ei ole üleslaaditud lehtedel nähtav."
      : "The visible first tasks were reviewed. Some expected guide tasks are not visible in the uploaded pages.",
    suggestedTotalPoints: null,
    maxPoints,
    suggestedGrade: null,
    reviewFlags: ["missing_page"]
  }
}
