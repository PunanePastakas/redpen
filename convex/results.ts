import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireOwnedStudent, requireOwnedWork, requireTeacher } from "./auth"
import { sha256Hex } from "./crypto"
import { languageValidator } from "./validators"

export const confirm = mutation({
  args: {
    workId: v.id("studentWorks"),
    studentId: v.id("students"),
    finalFeedback: v.string(),
    feedbackLanguage: languageValidator,
    totalPoints: v.optional(v.number()),
    maxPoints: v.optional(v.number()),
    grade: v.optional(v.string()),
    showPoints: v.boolean(),
    showGrade: v.boolean(),
    annotationScene: v.optional(
      v.object({
        version: v.string(),
        elements: v.array(v.any()),
        appState: v.optional(v.any())
      })
    )
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const work = await requireOwnedWork(ctx, teacher._id, args.workId)
    await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query("studentResults")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", teacher._id).eq("workId", args.workId))
      .unique()

    const payload = {
      teacherId: teacher._id,
      testId: work.testId,
      workId: work._id,
      studentId: args.studentId,
      finalFeedback: args.finalFeedback,
      feedbackLanguage: args.feedbackLanguage,
      totalPoints: args.totalPoints,
      maxPoints: args.maxPoints,
      grade: args.grade,
      showPoints: args.showPoints,
      showGrade: args.showGrade,
      annotationScene: args.annotationScene,
      status: "confirmed" as const,
      confirmedAt: now,
      updatedAt: now
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
      await ctx.db.patch(work._id, { status: "confirmed", confirmedAt: now, updatedAt: now })
      return existing._id
    }

    const resultId = await ctx.db.insert("studentResults", {
      ...payload,
      createdAt: now
    })
    await ctx.db.patch(work._id, { status: "confirmed", confirmedAt: now, updatedAt: now })
    return resultId
  }
})

export const share = mutation({
  args: { resultId: v.id("studentResults") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const result = await ctx.db.get(args.resultId)
    if (!result || result.teacherId !== teacher._id) {
      throw new Error("Result not found")
    }
    if (result.status !== "confirmed" && result.status !== "shared") {
      throw new Error("Only confirmed results can be shared")
    }
    const now = new Date().toISOString()
    await ctx.db.patch(result._id, { status: "shared", sharedAt: now, updatedAt: now })
    await ctx.db.patch(result.workId, { status: "shared", sharedAt: now, updatedAt: now })
  }
})

export const getByWork = query({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedWork(ctx, teacher._id, args.workId)
    return await ctx.db
      .query("studentResults")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", teacher._id).eq("workId", args.workId))
      .unique()
  }
})

export const getSharedByInviteToken = query({
  args: { token: v.string(), resultId: v.id("studentResults") },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.token)
    const token = await ctx.db
      .query("studentAccessTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique()
    if (!token || token.status !== "active" || new Date(token.expiresAt).getTime() <= Date.now()) return null

    const result = await ctx.db.get(args.resultId)
    if (!result || result.status !== "shared" || result.studentId !== token.studentId) return null

    const test = await ctx.db.get(result.testId)
    const teacher = await ctx.db.get(result.teacherId)

    return {
      resultId: result._id,
      testTitle: test?.title ?? "RedPen tulemus",
      teacherName: teacher?.name ?? teacher?.email ?? "Õpetaja",
      finalFeedback: result.finalFeedback,
      feedbackLanguage: result.feedbackLanguage,
      totalPoints: result.showPoints ? result.totalPoints : undefined,
      maxPoints: result.showPoints ? result.maxPoints : undefined,
      grade: result.showGrade ? result.grade : undefined,
      confirmedAt: result.confirmedAt,
      sharedAt: result.sharedAt,
      annotationScene: result.annotationScene
    }
  }
})

export const mockExport = query({
  args: { resultId: v.id("studentResults") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const result = await ctx.db.get(args.resultId)
    if (!result || result.teacherId !== teacher._id) throw new Error("Result not found")
    if (result.status !== "confirmed" && result.status !== "shared") {
      throw new Error("Mock export is unavailable before confirmation")
    }
    return {
      provider: "mock-ekool-stuudium",
      production: false,
      resultId: result._id,
      totalPoints: result.totalPoints,
      maxPoints: result.maxPoints,
      grade: result.grade,
      finalFeedback: result.finalFeedback,
      confirmedAt: result.confirmedAt
    }
  }
})
