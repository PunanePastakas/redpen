import { sha256HexSync } from "@/lib/hashing"

export type StudentAccessTokenRecord = {
  tokenHash: string
  studentId: string
  status: "active" | "revoked" | "expired"
  expiresAt: string
}

export type SharedStudentResultRecord = {
  studentId: string
  status: "draft" | "confirmed" | "shared" | "archived"
}

export function hashStudentInviteToken(token: string) {
  return sha256HexSync(token)
}

export function canViewSharedResult(input: {
  token: string
  tokenRecord: StudentAccessTokenRecord | null
  result: SharedStudentResultRecord | null
  now?: Date
}) {
  if (!input.tokenRecord || !input.result) return { allowed: false, reason: "not_found" as const }
  if (hashStudentInviteToken(input.token) !== input.tokenRecord.tokenHash) return { allowed: false, reason: "token_mismatch" as const }
  if (input.tokenRecord.status !== "active") return { allowed: false, reason: "token_inactive" as const }
  if (new Date(input.tokenRecord.expiresAt).getTime() <= (input.now ?? new Date()).getTime()) {
    return { allowed: false, reason: "token_expired" as const }
  }
  if (input.result.status !== "shared") return { allowed: false, reason: "result_not_shared" as const }
  if (input.result.studentId !== input.tokenRecord.studentId) return { allowed: false, reason: "student_mismatch" as const }
  return { allowed: true, reason: "ok" as const }
}
