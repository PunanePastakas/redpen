import { describe, expect, it } from "vitest"
import { canViewSharedResult, hashStudentInviteToken } from "@/lib/student-access"

const token = "student-demo-token"
const tokenRecord = {
  tokenHash: hashStudentInviteToken(token),
  studentId: "student-1",
  status: "active" as const,
  expiresAt: "2099-01-01T00:00:00.000Z"
}
const result = {
  studentId: "student-1",
  status: "shared" as const
}

describe("canViewSharedResult", () => {
  it("allows an active token scoped to a shared result", () => {
    expect(canViewSharedResult({ token, tokenRecord, result }).allowed).toBe(true)
  })

  it("denies another student's result", () => {
    expect(canViewSharedResult({ token, tokenRecord, result: { ...result, studentId: "student-2" } }).reason).toBe("student_mismatch")
  })

  it("denies unconfirmed results", () => {
    expect(canViewSharedResult({ token, tokenRecord, result: { ...result, status: "confirmed" } }).reason).toBe("result_not_shared")
  })
})
