import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { requireOwnedStudent, requireOwnedTest, requireOwnedWork, requireTeacher } from "./auth"
import { workStatusValidator } from "./validators"

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
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    return await ctx.db
      .query("studentWorks")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacher._id).eq("testId", args.testId))
      .collect()
  }
})

export const requestAnalysis = mutation({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const work = await requireOwnedWork(ctx, teacher._id, args.workId)
    await requireOwnedTest(ctx, teacher._id, work.testId)

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
    return { work, test, uploads, contextUploads }
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
    workMap: v.any(),
    studentIdentityDraft: v.optional(v.any()),
    contextInterpretation: v.optional(v.any()),
    overallDraft: v.optional(v.any()),
    reviewFlags: v.optional(v.array(v.string())),
    taskDrafts: v.array(v.any()),
    annotationTargets: v.array(v.any())
  },
  handler: async (ctx, args) => {
    const work = await ctx.db.get(args.workId)
    if (!work) throw new Error("Student work not found")
    const now = new Date().toISOString()
    const existingReviews = await ctx.db
      .query("taskReviews")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", work.teacherId).eq("workId", work._id))
      .collect()
    await Promise.all(existingReviews.map((review) => ctx.db.delete(review._id)))

    await ctx.db.patch(args.workId, {
      fullTranscription: args.fullTranscription,
      workMap: {
        ...args.workMap,
        contextInterpretation: args.contextInterpretation,
        overallDraft: args.overallDraft,
        reviewFlags: args.reviewFlags,
        annotationTargets: args.annotationTargets
      },
      detectedName: args.studentIdentityDraft?.detectedName ?? undefined,
      matchConfidence: args.studentIdentityDraft?.confidence ?? undefined,
      status: "needs_review",
      updatedAt: now
    })

    for (const draft of args.taskDrafts) {
      await ctx.db.insert("taskReviews", {
        teacherId: work.teacherId,
        testId: work.testId,
        workId: work._id,
        stableKey: draft.stableKey,
        sourceRefs: draft.sourceRefs,
        transcription: draft,
        feedbackDraft: draft.feedbackDraft,
        feedbackConfirmed: draft.feedbackDraft,
        feedbackLanguage: draft.feedbackLanguage,
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
