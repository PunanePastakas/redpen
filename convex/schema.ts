import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import {
  aiAttemptStatusValidator,
  annotationSceneValidator,
  fileKindValidator,
  languageValidator,
  resultStatusValidator,
  retentionStateValidator,
  taskModelStatusValidator,
  studentAccessStatusValidator,
  taskModelValidator,
  taskReviewStatusValidator,
  testStatusValidator,
  tokenStatusValidator,
  uploadRoleValidator,
  userRoleValidator,
  workStatusValidator
} from "./validators"

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    locale: v.optional(languageValidator),
    role: v.optional(userRoleValidator),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string())
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  students: defineTable({
    teacherId: v.id("users"),
    displayName: v.string(),
    normalizedName: v.string(),
    externalRef: v.optional(v.string()),
    preferredLanguage: languageValidator,
    accessStatus: studentAccessStatusValidator,
    archivedAt: v.optional(v.string()),
    mergedIntoStudentId: v.optional(v.id("students")),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_and_normalizedName", ["teacherId", "normalizedName"])
    .index("by_teacherId_and_accessStatus", ["teacherId", "accessStatus"]),

  studentAccessTokens: defineTable({
    teacherId: v.id("users"),
    studentId: v.id("students"),
    tokenHash: v.string(),
    status: tokenStatusValidator,
    expiresAt: v.string(),
    lastUsedAt: v.optional(v.string()),
    createdAt: v.string(),
    revokedAt: v.optional(v.string())
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_teacherId_and_studentId", ["teacherId", "studentId"])
    .index("by_status_and_expiresAt", ["status", "expiresAt"]),

  tests: defineTable({
    teacherId: v.id("users"),
    title: v.string(),
    testDate: v.optional(v.string()),
    subject: v.string(),
    gradeLevel: v.optional(v.string()),
    defaultFeedbackLanguage: languageValidator,
    maxPoints: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: testStatusValidator,
    taskModel: taskModelValidator,
    taskModelStatus: v.optional(taskModelStatusValidator),
    taskModelSourceHash: v.optional(v.string()),
    taskModelExtractedAt: v.optional(v.string()),
    taskModelReviewedAt: v.optional(v.string()),
    taskModelError: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_and_status", ["teacherId", "status"]),

  uploadedFiles: defineTable({
    teacherId: v.id("users"),
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
    retentionState: retentionStateValidator,
    deleteAfter: v.optional(v.string()),
    createdAt: v.string()
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_and_testId", ["teacherId", "testId"])
    .index("by_teacherId_and_studentWorkId", ["teacherId", "studentWorkId"])
    .index("by_retentionState_and_deleteAfter", ["retentionState", "deleteAfter"])
    .index("by_storageId", ["storageId"]),

  studentWorks: defineTable({
    teacherId: v.id("users"),
    testId: v.id("tests"),
    studentId: v.optional(v.id("students")),
    detectedName: v.optional(v.string()),
    matchConfidence: v.optional(v.number()),
    fullTranscription: v.optional(v.any()),
    workMap: v.optional(v.any()),
    status: workStatusValidator,
    createdAt: v.string(),
    updatedAt: v.string(),
    reviewedAt: v.optional(v.string()),
    confirmedAt: v.optional(v.string()),
    sharedAt: v.optional(v.string()),
    archivedAt: v.optional(v.string()),
    error: v.optional(v.string())
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_and_testId", ["teacherId", "testId"])
    .index("by_teacherId_and_studentId", ["teacherId", "studentId"])
    .index("by_teacherId_and_status", ["teacherId", "status"]),

  workPages: defineTable({
    teacherId: v.id("users"),
    workId: v.id("studentWorks"),
    uploadedFileId: v.id("uploadedFiles"),
    pageNumber: v.number(),
    pageImageStorageId: v.optional(v.id("_storage")),
    transcription: v.optional(v.any()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    createdAt: v.string()
  })
    .index("by_teacherId_and_workId", ["teacherId", "workId"])
    .index("by_uploadedFileId", ["uploadedFileId"]),

  testTasks: defineTable({
    teacherId: v.id("users"),
    testId: v.id("tests"),
    stableKey: v.string(),
    label: v.string(),
    maxPoints: v.optional(v.number()),
    criteria: v.optional(v.any()),
    source: v.string(),
    order: v.number(),
    ignoredAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_teacherId_and_testId", ["teacherId", "testId"])
    .index("by_teacherId_and_testId_and_stableKey", ["teacherId", "testId", "stableKey"]),

  taskReviews: defineTable({
    teacherId: v.id("users"),
    testId: v.id("tests"),
    workId: v.id("studentWorks"),
    taskId: v.optional(v.id("testTasks")),
    stableKey: v.string(),
    sourceRefs: v.any(),
    crop: v.optional(v.any()),
    transcription: v.optional(v.any()),
    feedbackDraft: v.string(),
    feedbackConfirmed: v.optional(v.string()),
    feedbackLanguage: languageValidator,
    pointsSuggested: v.optional(v.number()),
    pointsConfirmed: v.optional(v.number()),
    annotationScene: v.optional(annotationSceneValidator),
    status: taskReviewStatusValidator,
    reviewedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_teacherId_and_workId", ["teacherId", "workId"])
    .index("by_teacherId_and_workId_and_stableKey", ["teacherId", "workId", "stableKey"])
    .index("by_teacherId_and_testId", ["teacherId", "testId"]),

  studentResults: defineTable({
    teacherId: v.id("users"),
    testId: v.id("tests"),
    workId: v.id("studentWorks"),
    studentId: v.id("students"),
    finalFeedback: v.string(),
    feedbackLanguage: languageValidator,
    totalPoints: v.optional(v.number()),
    maxPoints: v.optional(v.number()),
    grade: v.optional(v.string()),
    showPoints: v.boolean(),
    showGrade: v.boolean(),
    annotationScene: v.optional(annotationSceneValidator),
    status: resultStatusValidator,
    confirmedAt: v.optional(v.string()),
    sharedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_teacherId_and_workId", ["teacherId", "workId"])
    .index("by_teacherId_and_studentId", ["teacherId", "studentId"])
    .index("by_workId", ["workId"]),

  aiAttempts: defineTable({
    teacherId: v.id("users"),
    testId: v.optional(v.id("tests")),
    workId: v.optional(v.id("studentWorks")),
    taskReviewId: v.optional(v.id("taskReviews")),
    provider: v.string(),
    endpoint: v.string(),
    dataControlMode: v.string(),
    dataResidencyRegion: v.optional(v.string()),
    model: v.string(),
    apiVersion: v.optional(v.string()),
    promptVersion: v.string(),
    schemaVersion: v.string(),
    purpose: v.string(),
    status: aiAttemptStatusValidator,
    inputHash: v.optional(v.string()),
    outputHash: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.string(),
    completedAt: v.optional(v.string())
  })
    .index("by_teacherId_and_workId", ["teacherId", "workId"])
    .index("by_teacherId_and_status", ["teacherId", "status"]),

  auditLogs: defineTable({
    teacherId: v.optional(v.id("users")),
    actorUserId: v.optional(v.id("users")),
    actorType: v.union(v.literal("teacher"), v.literal("student_invite"), v.literal("system")),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.any()),
    createdAt: v.string()
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_teacherId_and_action", ["teacherId", "action"])
    .index("by_targetType_and_targetId", ["targetType", "targetId"]),

  retentionEvents: defineTable({
    teacherId: v.id("users"),
    uploadedFileId: v.id("uploadedFiles"),
    action: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
    createdAt: v.string()
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_uploadedFileId", ["uploadedFileId"])
})
