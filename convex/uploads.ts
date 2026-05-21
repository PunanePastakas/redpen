import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireOwnedTest, requireOwnedWork, requireTeacher } from "./auth"
import { fileKindValidator, languageValidator, uploadRoleValidator } from "./validators"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireTeacher(ctx)
    return await ctx.storage.generateUploadUrl()
  }
})

export const recordUploadedFile = mutation({
  args: {
    testId: v.optional(v.id("tests")),
    studentWorkId: v.optional(v.id("studentWorks")),
    storageId: v.id("_storage"),
    role: uploadRoleValidator,
    filename: v.string(),
    fileKind: fileKindValidator,
    mimeType: v.string(),
    size: v.number(),
    sha256: v.string(),
    languageHint: v.optional(languageValidator),
    deleteAfter: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    if (args.testId) await requireOwnedTest(ctx, teacher._id, args.testId)
    if (args.studentWorkId) await requireOwnedWork(ctx, teacher._id, args.studentWorkId)

    return await ctx.db.insert("uploadedFiles", {
      teacherId: teacher._id,
      testId: args.testId,
      studentWorkId: args.studentWorkId,
      storageId: args.storageId,
      role: args.role,
      filename: args.filename,
      fileKind: args.fileKind,
      mimeType: args.mimeType,
      size: args.size,
      sha256: args.sha256,
      languageHint: args.languageHint,
      retentionState: "active",
      deleteAfter: args.deleteAfter,
      createdAt: new Date().toISOString()
    })
  }
})

export const listByTest = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedTest(ctx, teacher._id, args.testId)
    const uploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_testId", (q) => q.eq("teacherId", teacher._id).eq("testId", args.testId))
      .collect()
    return await Promise.all(uploads.map(async (upload) => ({ ...upload, url: await ctx.storage.getUrl(upload.storageId) })))
  }
})

export const listByWork = query({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx)
    await requireOwnedWork(ctx, teacher._id, args.workId)
    const uploads = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_teacherId_and_studentWorkId", (q) => q.eq("teacherId", teacher._id).eq("studentWorkId", args.workId))
      .collect()
    return await Promise.all(uploads.map(async (upload) => ({ ...upload, url: await ctx.storage.getUrl(upload.storageId) })))
  }
})
