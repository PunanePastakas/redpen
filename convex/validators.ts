import { v } from "convex/values"

export const languageValidator = v.union(v.literal("et"), v.literal("en"))
export const userRoleValidator = v.literal("teacher")
export const studentAccessStatusValidator = v.union(v.literal("not_invited"), v.literal("invite_ready"), v.literal("active"), v.literal("revoked"))
export const testStatusValidator = v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
export const taskModelStatusValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("extracting"),
  v.literal("ready"),
  v.literal("stale"),
  v.literal("failed")
)
export const uploadRoleValidator = v.union(
  v.literal("student_work"),
  v.literal("grading_context"),
  v.literal("derived_page"),
  v.literal("derived_crop")
)
export const fileKindValidator = v.union(v.literal("image"), v.literal("pdf"), v.literal("text"), v.literal("unknown"))
export const workStatusValidator = v.union(
  v.literal("uploaded"),
  v.literal("transcribing"),
  v.literal("mapped"),
  v.literal("drafted"),
  v.literal("needs_review"),
  v.literal("reviewed"),
  v.literal("confirmed"),
  v.literal("shared"),
  v.literal("archived"),
  v.literal("error")
)
export const taskReviewStatusValidator = v.union(
  v.literal("needs_review"),
  v.literal("accepted"),
  v.literal("edited"),
  v.literal("rejected"),
  v.literal("manual"),
  v.literal("confirmed")
)
export const resultStatusValidator = v.union(v.literal("draft"), v.literal("confirmed"), v.literal("shared"), v.literal("archived"))
export const retentionStateValidator = v.union(
  v.literal("active"),
  v.literal("queued_for_deletion"),
  v.literal("deleted"),
  v.literal("delete_failed"),
  v.literal("retained_by_policy")
)
export const aiAttemptStatusValidator = v.union(v.literal("started"), v.literal("completed"), v.literal("failed"))
export const tokenStatusValidator = v.union(v.literal("active"), v.literal("revoked"), v.literal("expired"))

export const taskModelValidator = v.array(
  v.object({
    stableKey: v.string(),
    label: v.string(),
    likelyTaskNumber: v.optional(v.union(v.string(), v.null())),
    maxPoints: v.optional(v.number()),
    criteria: v.optional(v.any()),
    sourceRefs: v.optional(v.array(v.any())),
    extractionWarnings: v.optional(v.array(v.string())),
    source: v.string(),
    order: v.number()
  })
)

export const annotationSceneValidator = v.object({
  version: v.string(),
  elements: v.array(v.any()),
  appState: v.optional(v.any())
})
