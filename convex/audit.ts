import { v } from "convex/values"
import { internalMutation } from "./_generated/server"

export const write = internalMutation({
  args: {
    teacherId: v.optional(v.id("users")),
    actorUserId: v.optional(v.id("users")),
    actorType: v.union(v.literal("teacher"), v.literal("student_invite"), v.literal("system")),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: new Date().toISOString()
    })
  }
})
