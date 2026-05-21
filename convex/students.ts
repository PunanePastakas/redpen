import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { ensureTeacher, requireOwnedStudent, requireTeacher } from "./auth"
import { randomToken, sha256Hex } from "./crypto"
import { languageValidator } from "./validators"

function normalizeName(value: string) {
  return value
    .toLocaleLowerCase("et")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    const students = await ctx.db
      .query("students")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacher._id))
      .collect()

    return students.filter((student) => args.includeArchived || !student.archivedAt)
  }
})

export const create = mutation({
  args: {
    displayName: v.string(),
    externalRef: v.optional(v.string()),
    preferredLanguage: languageValidator
  },
  handler: async (ctx, args) => {
    const teacher = await ensureTeacher(ctx)
    const now = new Date().toISOString()
    return await ctx.db.insert("students", {
      teacherId: teacher._id,
      displayName: args.displayName,
      normalizedName: normalizeName(args.displayName),
      externalRef: args.externalRef,
      preferredLanguage: args.preferredLanguage,
      accessStatus: "not_invited",
      createdAt: now,
      updatedAt: now
    })
  }
})

export const update = mutation({
  args: {
    studentId: v.id("students"),
    displayName: v.optional(v.string()),
    externalRef: v.optional(v.string()),
    preferredLanguage: v.optional(languageValidator)
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const patch = {
      ...(args.displayName ? { displayName: args.displayName, normalizedName: normalizeName(args.displayName) } : {}),
      ...(args.externalRef !== undefined ? { externalRef: args.externalRef } : {}),
      ...(args.preferredLanguage ? { preferredLanguage: args.preferredLanguage } : {}),
      updatedAt: new Date().toISOString()
    }
    await ctx.db.patch(args.studentId, patch)
  }
})

export const archive = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const now = new Date().toISOString()
    await ctx.db.patch(args.studentId, {
      archivedAt: now,
      accessStatus: "revoked",
      updatedAt: now
    })
  }
})

export const merge = mutation({
  args: {
    sourceStudentId: v.id("students"),
    targetStudentId: v.id("students")
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    if (args.sourceStudentId === args.targetStudentId) {
      throw new Error("Cannot merge a student into itself")
    }
    await requireOwnedStudent(ctx, teacher._id, args.sourceStudentId)
    await requireOwnedStudent(ctx, teacher._id, args.targetStudentId)
    const now = new Date().toISOString()
    await ctx.db.patch(args.sourceStudentId, {
      mergedIntoStudentId: args.targetStudentId,
      archivedAt: now,
      accessStatus: "revoked",
      updatedAt: now
    })
  }
})

export const issueInviteToken = mutation({
  args: {
    studentId: v.id("students"),
    expiresAt: v.string()
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const token = randomToken()
    const tokenHash = await sha256Hex(token)
    const now = new Date().toISOString()
    await ctx.db.insert("studentAccessTokens", {
      teacherId: teacher._id,
      studentId: args.studentId,
      tokenHash,
      status: "active",
      expiresAt: args.expiresAt,
      createdAt: now
    })
    await ctx.db.patch(args.studentId, {
      accessStatus: "invite_ready",
      updatedAt: now
    })
    return { token }
  }
})

export const revokeInviteTokens = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedStudent(ctx, teacher._id, args.studentId)
    const now = new Date().toISOString()
    const tokens = await ctx.db
      .query("studentAccessTokens")
      .withIndex("by_teacherId_and_studentId", (q) => q.eq("teacherId", teacher._id).eq("studentId", args.studentId))
      .collect()

    await Promise.all(tokens.map((token) => ctx.db.patch(token._id, { status: "revoked", revokedAt: now })))
    await ctx.db.patch(args.studentId, {
      accessStatus: "revoked",
      updatedAt: now
    })
  }
})
