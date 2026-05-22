import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import { requireOwnedStudent, requireOwnedTest, requireOwnedWork, requireTeacher } from "./auth"
import { workStatusValidator } from "./validators"
import { canRemoveWorkFromActiveWorkflow } from "../lib/workflow-state"

export const create = mutation({
  args: {
    testId: v.id("tests"),
    studentId: v.optional(v.id("students")),
    detectedName: v.optional(v.string()),
    matchConfidence: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    if (args.studentId) await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const now = new Date().toISOString()
    return await ctx.db.insert("studentWorks", {
      teacherId: teacher._id,
      testId: args.testId,
      studentId: args.studentId,
      detectedName: args.detectedName,
      matchConfidence: args.matchConfidence,
      status: "uploaded",
      createdAt: now,
      updatedAt: now
    })
  }
})

export const listByTest = query({
  args: { testId: v.id("tests"), includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    const works = await ctx.db
      .query("studentWorks")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacher._id).eq("testId", args.testId))
      .collect()
    return args.includeArchived ? works : works.filter((work) => work.status !== "archived" && !work.archivedAt)
  }
})

export const archive = mutation({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const work = await requireOwnedWork(ctx, teacher._id, args.workId)
    if (!canRemoveWorkFromActiveWorkflow(work.status)) {
      throw new Error("This work cannot be removed from the active workflow right now")
    }

    const now = new Date().toISOString()
    await ctx.db.patch(work._id, {
      status: "archived",
      archivedAt: now,
      updatedAt: now
    })
  }
})

export const restore = mutation({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const work = await requireOwnedWork(ctx, teacher._id, args.workId)
    if (work.status !== "archived" && !work.archivedAt) return

    const reviews = await ctx.db
      .query("taskReviews")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", teacher._id).eq("workId", work._id))
      .collect()
    const result = await ctx.db
      .query("studentResults")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", teacher._id).eq("workId", work._id))
      .unique()

    const restoredStatus =
      result?.status === "shared"
        ? "shared"
        : result?.status === "confirmed"
          ? "confirmed"
          : work.error
            ? "error"
            : reviews.length > 0
              ? "needs_review"
              : "uploaded"

    await ctx.db.patch(work._id, {
      status: restoredStatus,
      archivedAt: undefined,
      updatedAt: new Date().toISOString()
    })
  }
})

export const requestAnalysis = mutation({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const work = await requireOwnedWork(ctx, teacher._id, args.workId)
    const test = await requireOwnedTest(ctx, teacher._id, work.testId)
    if (!canQueueAnalysis(work.status)) {
      throw new Error("This work cannot be queued for analysis in its current status")
    }
    await ensureGuideTaskModelReadyForAnalysis(ctx, teacher._id, test)

    const uploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_studentWorkId", (q) => q.eq("teacherId", teacher._id).eq("studentWorkId", work._id))
      .collect()
    const workUploads = uploads.filter((upload) => upload.role === "student_work")
    if (workUploads.length === 0) {
      throw new Error("Upload at least one student work file before analysis")
    }

    const now = new Date().toISOString()
    await ctx.db.patch(work._id, {
      status: "transcribing",
      error: undefined,
      updatedAt: now
    })
    await ctx.scheduler.runAfter(0, internal.aiActions.analyzeWorkInternal, { workId: work._id })
  }
})

export const requestAnalysisBatch = mutation({
  args: {
    testId: v.optional(v.id("tests")),
    workIds: v.optional(v.array(v.id("studentWorks")))
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const now = new Date().toISOString()
    const worksToAnalyze = await resolveWorksForBatch(ctx, teacher._id, args)

    if (worksToAnalyze.length === 0) {
      throw new Error("No uploaded works are ready for analysis")
    }

    const eligibleWorks: typeof worksToAnalyze = []
    for (const work of worksToAnalyze) {
      const test = await requireOwnedTest(ctx, teacher._id, work.testId)
      await ensureGuideTaskModelReadyForAnalysis(ctx, teacher._id, test)
      const uploads = await ctx.db
        .query("uploadedFiles")
        .withIndex("by_teacherId_and_studentWorkId", (q) => q.eq("teacherId", teacher._id).eq("studentWorkId", work._id))
        .collect()
      const workUploads = uploads.filter((upload) => upload.role === "student_work")
      if (workUploads.length === 0) {
        if (!args.workIds?.length) continue
        throw new Error("Every selected work must have at least one student work file before analysis")
      }
      eligibleWorks.push(work)
    }

    if (eligibleWorks.length === 0) {
      throw new Error("No uploaded works are ready for analysis")
    }

    await Promise.all(eligibleWorks.map((work) =>
      ctx.db.patch(work._id, {
        status: "transcribing",
        error: undefined,
        updatedAt: now
      })
    ))

    // Each work gets its own scheduled action so one completed draft can become reviewable
    // while the remaining works are still being analyzed.
    await Promise.all(eligibleWorks.map((work) =>
      ctx.scheduler.runAfter(0, internal.aiActions.analyzeWorkInternal, { workId: work._id })
    ))

    return { queued: eligibleWorks.length, workIds: eligibleWorks.map((work) => work._id) }
  }
})

export const confirmNameMatch = mutation({
  args: {
    workId: v.id("studentWorks"),
    studentId: v.optional(v.id("students")),
    detectedName: v.optional(v.string()),
    matchConfidence: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedWork(ctx, teacher._id, args.workId)
    if (args.studentId) await requireOwnedStudent(ctx, teacher._id, args.studentId)
    await ctx.db.patch(args.workId, {
      studentId: args.studentId,
      detectedName: args.detectedName,
      matchConfidence: args.matchConfidence,
      updatedAt: new Date().toISOString()
    })
  }
})

export const setStatus = mutation({
  args: { workId: v.id("studentWorks"), status: workStatusValidator, error: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedWork(ctx, teacher._id, args.workId)
    await ctx.db.patch(args.workId, {
      status: args.status,
      error: args.error,
      updatedAt: new Date().toISOString()
    })
  }
})

export const getForAi = internalQuery({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const work = await ctx.db.get(args.workId)
    if (!work) throw new Error("Student work not found")
    const test = await ctx.db.get(work.testId)
    if (!test) throw new Error("Test not found")
    const uploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_studentWorkId", (q) => q.eq("teacherId", work.teacherId).eq("studentWorkId", work._id))
      .collect()
    const testUploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", work.teacherId).eq("testId", work.testId))
      .collect()
    const contextUploads = testUploads.filter((upload) => upload.role === "grading_context")
    const testTasks = await ctx.db
      .query("testTasks")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", work.teacherId).eq("testId", work.testId))
      .collect()
    return { work, test, uploads, contextUploads, testTasks: testTasks.filter((task) => !task.ignoredAt).sort((left, right) => left.order - right.order) }
  }
})

export const setStatusForAi = internalMutation({
  args: { workId: v.id("studentWorks"), status: workStatusValidator, error: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workId, {
      status: args.status,
      error: args.error,
      updatedAt: new Date().toISOString()
    })
  }
})

export const applyAnalysisDraft = internalMutation({
  args: {
    workId: v.id("studentWorks"),
    fullTranscription: v.any(),
    studentName: v.object({
      detectedName: v.union(v.string(), v.null()),
      evidence: v.array(v.any())
    }),
    generalFeedback: v.string(),
    suggestedTotalPoints: v.union(v.number(), v.null()),
    maxPoints: v.union(v.number(), v.null()),
    suggestedGrade: v.union(v.string(), v.null()),
    reviewFlags: v.optional(v.array(v.string())),
    tasks: v.array(v.any()),
    annotationTargets: v.array(v.any())
  },
  handler: async (ctx, args) => {
    const work = await ctx.db.get(args.workId)
    if (!work) throw new Error("Student work not found")
    const test = await ctx.db.get(work.testId)
    if (!test) throw new Error("Test not found")
    const now = new Date().toISOString()
    const existingReviews = await ctx.db
      .query("taskReviews")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", work.teacherId).eq("workId", work._id))
      .collect()
    await Promise.all(existingReviews.map((review) => ctx.db.delete(review._id)))
    const expectedTasks = await ctx.db
      .query("testTasks")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", work.teacherId).eq("testId", work.testId))
      .collect()
    const expectedTaskByStableKey = new Map(expectedTasks.map((task) => [task.stableKey, task._id]))

    await ctx.db.patch(args.workId, {
      fullTranscription: args.fullTranscription,
      workMap: {
        tasks: args.tasks,
        generalFeedback: args.generalFeedback,
        suggestedTotalPoints: args.suggestedTotalPoints,
        maxPoints: args.maxPoints,
        suggestedGrade: args.suggestedGrade,
        reviewFlags: args.reviewFlags,
        annotationTargets: args.annotationTargets
      },
      detectedName: args.studentName.detectedName ?? undefined,
      matchConfidence: undefined,
      status: "needs_review",
      updatedAt: now
    })

    for (const draft of args.tasks) {
      await ctx.db.insert("taskReviews", {
        teacherId: work.teacherId,
        testId: work.testId,
        workId: work._id,
        taskId: expectedTaskByStableKey.get(draft.stableKey),
        stableKey: draft.stableKey,
        sourceRefs: draft.sourceRefs,
        transcription: draft,
        feedbackDraft: draft.feedbackDraft,
        feedbackConfirmed: draft.feedbackDraft,
        feedbackLanguage: test.defaultFeedbackLanguage,
        pointsSuggested: draft.suggestedPoints?.value ?? undefined,
        pointsConfirmed: draft.suggestedPoints?.value ?? undefined,
        annotationScene: {
          version: "redpen-excalidraw-compatible-v1",
          elements: args.annotationTargets.filter((target) => target.taskStableKey === draft.stableKey)
        },
        status: "needs_review",
        createdAt: now,
        updatedAt: now
      })
    }
  }
})

async function resolveWorksForBatch(
  ctx: MutationCtx,
  teacherId: Id<"users">,
  args: { testId?: Id<"tests">; workIds?: Id<"studentWorks">[] }
) {
  if (args.workIds?.length) {
    const works = []
    for (const workId of args.workIds) {
      const work = await requireOwnedWork(ctx, teacherId, workId)
      await requireOwnedTest(ctx, teacherId, work.testId)
      if (!canQueueAnalysis(work.status)) {
        throw new Error("This work cannot be queued for analysis in its current status")
      }
      works.push(work)
    }
    return works
  }

  if (!args.testId) {
    throw new Error("Select at least one work or a test before queueing analysis")
  }

  const testId = args.testId
  await requireOwnedTest(ctx, teacherId, testId)
  const works = await ctx.db
    .query("studentWorks")
    .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacherId).eq("testId", testId))
    .collect()

  return works.filter((work) => canQueueAnalysis(work.status))
}

function canQueueAnalysis(status: Doc<"studentWorks">["status"]) {
  return status !== "transcribing" && status !== "mapped" && status !== "drafted" && status !== "confirmed" && status !== "shared" && status !== "archived"
}

async function ensureGuideTaskModelReadyForAnalysis(ctx: MutationCtx, teacherId: Id<"users">, test: Doc<"tests">) {
  const uploads = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacherId).eq("testId", test._id))
    .collect()
  const hasGuide = uploads.some((upload) => upload.role === "grading_context")
  if (!hasGuide) return

  const ready = test.taskModelStatus === "ready" || (!test.taskModelStatus && test.taskModel.length > 0)
  if (!ready) {
    throw new Error("The grading guide task model is not ready yet. Wait for extraction to finish or retry guide extraction.")
  }
}
