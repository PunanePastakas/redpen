import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireOwnedTaskReview, requireOwnedWork, requireTeacher } from "./auth"
import { annotationSceneValidator, languageValidator, taskReviewStatusValidator } from "./validators"

export const listByWork = query({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedWork(ctx, teacher._id, args.workId)
    return await ctx.db
      .query("taskReviews")
      .withIndex("by_teacherId_and_workId", (q) => q.eq("teacherId", teacher._id).eq("workId", args.workId))
      .collect()
  }
})

export const updateDecision = mutation({
  args: {
    taskReviewId: v.id("taskReviews"),
    status: taskReviewStatusValidator,
    feedbackConfirmed: v.optional(v.string()),
    feedbackLanguage: v.optional(languageValidator),
    pointsConfirmed: v.optional(v.number()),
    annotationScene: v.optional(annotationSceneValidator)
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTaskReview(ctx, teacher._id, args.taskReviewId)
    const now = new Date().toISOString()
    await ctx.db.patch(args.taskReviewId, {
      status: args.status,
      ...(args.feedbackConfirmed !== undefined ? { feedbackConfirmed: args.feedbackConfirmed } : {}),
      ...(args.feedbackLanguage ? { feedbackLanguage: args.feedbackLanguage } : {}),
      ...(args.pointsConfirmed !== undefined ? { pointsConfirmed: args.pointsConfirmed } : {}),
      ...(args.annotationScene ? { annotationScene: args.annotationScene } : {}),
      reviewedAt: now,
      updatedAt: now
    })
  }
})
