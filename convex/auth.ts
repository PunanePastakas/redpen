import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server";
import { getAuthUserId } from "@convex-dev/auth/server"
import type { Id } from "./_generated/dataModel"
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server"

type AuthCtx = {
  auth: ActionCtx["auth"]
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const now = new Date().toISOString()
        const email = typeof params.email === "string" ? params.email.trim().toLocaleLowerCase("en") : ""
        const name = typeof params.name === "string" && params.name.trim() ? params.name.trim() : undefined

        const profile = {
          email,
          locale: "et",
          role: "teacher",
          createdAt: now,
          updatedAt: now
        }

        return name ? { ...profile, name } : profile
      }
    })
  ],
  session: {
    totalDurationMs: 1000 * 60 * 60 * 24 * 30,
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 30
  }
});

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export async function requireCurrentUserId(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new AuthorizationError("Authentication required")
  }
  return userId
}

export async function requireIdentity(ctx: AuthCtx) {
  return await requireCurrentUserId(ctx)
}

export async function requireTeacher(ctx: QueryCtx | MutationCtx) {
  const userId = await requireCurrentUserId(ctx)
  const teacher = await ctx.db.get(userId)
  if (!teacher) {
    throw new AuthorizationError("Teacher account has not been provisioned")
  }
  if (teacher.role !== "teacher") {
    throw new AuthorizationError("Teacher access is required")
  }

  return teacher
}

export async function ensureTeacher(ctx: MutationCtx) {
  const userId = await requireCurrentUserId(ctx)
  const now = new Date().toISOString()
  const existing = await ctx.db.get(userId)

  if (existing) {
    await ctx.db.patch(userId, {
      locale: existing.locale ?? "et",
      role: "teacher",
      createdAt: existing.createdAt ?? now,
      updatedAt: now
    })
    return {
      ...existing,
      locale: existing.locale ?? "et",
      role: "teacher" as const,
      createdAt: existing.createdAt ?? now,
      updatedAt: now
    }
  }

  throw new AuthorizationError("Teacher account has not been provisioned")
}

export async function requireOwnedStudent(ctx: QueryCtx | MutationCtx, teacherId: Id<"users">, studentId: Id<"students">) {
  const student = await ctx.db.get(studentId)
  if (!student || student.teacherId !== teacherId) {
    throw new AuthorizationError("Student is not owned by the current teacher")
  }
  return student
}

export async function requireOwnedTest(ctx: QueryCtx | MutationCtx, teacherId: Id<"users">, testId: Id<"tests">) {
  const test = await ctx.db.get(testId)
  if (!test || test.teacherId !== teacherId) {
    throw new AuthorizationError("Test is not owned by the current teacher")
  }
  return test
}

export async function requireOwnedWork(ctx: QueryCtx | MutationCtx, teacherId: Id<"users">, workId: Id<"studentWorks">) {
  const work = await ctx.db.get(workId)
  if (!work || work.teacherId !== teacherId) {
    throw new AuthorizationError("Student work is not owned by the current teacher")
  }
  return work
}

export async function requireOwnedTaskReview(ctx: QueryCtx | MutationCtx, teacherId: Id<"users">, taskReviewId: Id<"taskReviews">) {
  const review = await ctx.db.get(taskReviewId)
  if (!review || review.teacherId !== teacherId) {
    throw new AuthorizationError("Task review is not owned by the current teacher")
  }
  return review
}
