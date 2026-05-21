import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
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
    await ctx.db.patch(args.testId, {
      taskModel: args.taskModel,
      updatedAt: new Date().toISOString()
    })
  }
})
