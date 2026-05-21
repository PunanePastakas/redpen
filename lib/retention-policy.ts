export type WorkRetentionState = "active" | "queued_for_deletion" | "deleted" | "delete_failed" | "retained_by_policy"
export type WorkStatus = "uploaded" | "transcribing" | "mapped" | "drafted" | "needs_review" | "reviewed" | "confirmed" | "shared" | "archived" | "error"

export type RetentionPolicy = {
  rawFileRetentionDays: number
  deleteAfterShareHours: number
  abandonedDraftRetentionDays: number
}

export const defaultRetentionPolicy: RetentionPolicy = {
  rawFileRetentionDays: 14,
  deleteAfterShareHours: 24,
  abandonedDraftRetentionDays: 30
}

export function computeDeleteAfter(
  input: {
    status: WorkStatus
    uploadedAt: Date
    sharedAt?: Date | null
    archivedAt?: Date | null
    now?: Date
  },
  policy: RetentionPolicy = defaultRetentionPolicy
) {
  const base = input.sharedAt ?? input.archivedAt
  if (input.status === "shared" || input.status === "archived") {
    return addHours(base ?? input.now ?? new Date(), policy.deleteAfterShareHours)
  }

  if (input.status === "uploaded" || input.status === "drafted" || input.status === "needs_review" || input.status === "error") {
    return addDays(input.uploadedAt, policy.abandonedDraftRetentionDays)
  }

  return addDays(input.uploadedAt, policy.rawFileRetentionDays)
}

export function shouldQueueDeletion(input: { retentionState: WorkRetentionState; deleteAfter: Date; now: Date }) {
  return input.retentionState === "active" && input.deleteAfter.getTime() <= input.now.getTime()
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addDays(date: Date, days: number) {
  return addHours(date, days * 24)
}
