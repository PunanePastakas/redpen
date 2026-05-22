import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { ensureTeacher, requireOwnedTest, requireTeacher } from "./auth"
import { languageValidator, taskModelValidator, testStatusValidator } from "./validators"

export const list = query({
  args: { status: v.optional(testStatusValidator) },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const status = args.status
    if (status) {
      return await ctx.db
        .query("tests")
        .withIndex("by_teacherId_and_status", (q) => q.eq("teacherId", teacher._id).eq("status", status))
        .collect()
    }

    return await ctx.db
      .query("tests")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacher._id))
      .collect()
  }
})

export const get = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    return await requireOwnedTest(ctx, teacher._id, args.testId)
  }
})

export const create = mutation({
  args: {
    title: v.string(),
    testDate: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    defaultFeedbackLanguage: languageValidator,
    maxPoints: v.optional(v.number()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const teacher = await ensureTeacher(ctx)
    const now = new Date().toISOString()
    return await ctx.db.insert("tests", {
      teacherId: teacher._id,
      title: args.title,
      testDate: args.testDate,
      subject: "mathematics",
      gradeLevel: args.gradeLevel,
      defaultFeedbackLanguage: args.defaultFeedbackLanguage,
      maxPoints: args.maxPoints,
      notes: args.notes,
      status: "draft",
      taskModel: [],
      taskModelStatus: "none",
      createdAt: now,
      updatedAt: now
    })
  }
})

export const update = mutation({
  args: {
    testId: v.id("tests"),
    title: v.optional(v.string()),
    testDate: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    defaultFeedbackLanguage: v.optional(languageValidator),
    maxPoints: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(testStatusValidator)
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    await ctx.db.patch(args.testId, {
      ...(args.title ? { title: args.title } : {}),
      ...(args.testDate !== undefined ? { testDate: args.testDate } : {}),
      ...(args.gradeLevel !== undefined ? { gradeLevel: args.gradeLevel } : {}),
      ...(args.defaultFeedbackLanguage ? { defaultFeedbackLanguage: args.defaultFeedbackLanguage } : {}),
      ...(args.maxPoints !== undefined ? { maxPoints: args.maxPoints } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      ...(args.status ? { status: args.status } : {}),
      updatedAt: new Date().toISOString()
    })
  }
})

export const replaceTaskModel = mutation({
  args: {
    testId: v.id("tests"),
    taskModel: taskModelValidator
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    await replaceTaskModelDocuments(ctx, {
      teacherId: teacher._id,
      testId: args.testId,
      taskModel: args.taskModel,
      status: args.taskModel.length > 0 ? "ready" : "none",
      reviewedAt: new Date().toISOString()
    })
  }
})

export const requestTaskModelExtraction = mutation({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    const uploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacher._id).eq("testId", args.testId))
      .collect()
    if (!uploads.some((upload) => upload.role === "grading_context")) {
      throw new Error("Upload a grading guide before extracting the task model")
    }

    await ctx.db.patch(args.testId, {
      taskModelStatus: "pending",
      taskModelError: undefined,
      updatedAt: new Date().toISOString()
    })
    await ctx.scheduler.runAfter(0, internal.aiActions.extractTaskModelInternal, { testId: args.testId })
  }
})

export const getForTaskModelExtraction = internalQuery({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId)
    if (!test) throw new Error("Test not found")
    const contextUploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", test.teacherId).eq("testId", test._id))
      .collect()
    return { test, contextUploads: contextUploads.filter((upload) => upload.role === "grading_context") }
  }
})

export const replaceTaskModelForAi = internalMutation({
  args: {
    teacherId: v.id("users"),
    testId: v.id("tests"),
    taskModel: taskModelValidator,
    sourceHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId)
    if (!test) throw new Error("Test not found")
    if (test.teacherId !== args.teacherId) throw new Error("Test teacher mismatch")
    if (args.sourceHash && test.taskModelSourceHash && test.taskModelSourceHash !== args.sourceHash) return

    await replaceTaskModelDocuments(ctx, {
      teacherId: args.teacherId,
      testId: args.testId,
      taskModel: args.taskModel,
      status: args.taskModel.length > 0 ? "ready" : "none",
      sourceHash: args.sourceHash,
      extractedAt: new Date().toISOString()
    })
  }
})

export const markTaskModelExtractionStarted = internalMutation({
  args: { testId: v.id("tests"), sourceHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testId, {
      taskModelStatus: "extracting",
      taskModelSourceHash: args.sourceHash,
      taskModelError: undefined,
      updatedAt: new Date().toISOString()
    })
  }
})

export const markTaskModelExtractionFailed = internalMutation({
  args: { testId: v.id("tests"), sourceHash: v.string(), error: v.string() },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId)
    if (!test) throw new Error("Test not found")
    if (test.taskModelSourceHash && test.taskModelSourceHash !== args.sourceHash) return

    await ctx.db.patch(args.testId, {
      taskModelStatus: "failed",
      taskModelError: args.error,
      updatedAt: new Date().toISOString()
    })
  }
})

async function replaceTaskModelDocuments(
  ctx: MutationCtx,
  input: {
    teacherId: Id<"users">
    testId: Id<"tests">
    taskModel: Array<{
      stableKey: string
      label: string
      likelyTaskNumber?: string | null
      maxPoints?: number
      criteria?: unknown
      sourceRefs?: unknown[]
      extractionWarnings?: string[]
      source: string
      order: number
    }>
    status: "none" | "ready"
    sourceHash?: string
    extractedAt?: string
    reviewedAt?: string
  }
) {
  const now = new Date().toISOString()
  const existingTasks = await ctx.db
    .query("testTasks")
    .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", input.teacherId).eq("testId", input.testId))
    .collect()
  await Promise.all(existingTasks.map((task) => ctx.db.delete(task._id)))

  for (const task of input.taskModel) {
    await ctx.db.insert("testTasks", {
      teacherId: input.teacherId,
      testId: input.testId,
      stableKey: task.stableKey,
      label: task.label,
      ...(typeof task.maxPoints === "number" ? { maxPoints: task.maxPoints } : {}),
      criteria: {
        value: task.criteria ?? null,
        likelyTaskNumber: task.likelyTaskNumber ?? null,
        sourceRefs: task.sourceRefs ?? [],
        extractionWarnings: task.extractionWarnings ?? []
      },
      source: task.source,
      order: task.order,
      createdAt: now,
      updatedAt: now
    })
  }

  await ctx.db.patch(input.testId, {
    taskModel: input.taskModel,
    taskModelStatus: input.status,
    taskModelSourceHash: input.sourceHash,
    taskModelExtractedAt: input.extractedAt,
    taskModelReviewedAt: input.reviewedAt,
    taskModelError: undefined,
    updatedAt: now
  })
}
