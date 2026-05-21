import { describe, expect, it } from "vitest"
import { computeDeleteAfter, defaultRetentionPolicy, shouldQueueDeletion } from "@/lib/retention-policy"

describe("retention policy", () => {
  it("queues shared work for deletion within the configured hours", () => {
    const sharedAt = new Date("2026-05-21T10:00:00.000Z")
    const deleteAfter = computeDeleteAfter({
      status: "shared",
      uploadedAt: new Date("2026-05-20T10:00:00.000Z"),
      sharedAt
    })

    expect(deleteAfter.toISOString()).toBe("2026-05-22T10:00:00.000Z")
  })

  it("caps abandoned drafts according to policy", () => {
    const uploadedAt = new Date("2026-05-01T10:00:00.000Z")
    const deleteAfter = computeDeleteAfter({
      status: "needs_review",
      uploadedAt
    })

    expect(deleteAfter.toISOString()).toBe("2026-05-31T10:00:00.000Z")
  })

  it("detects due active files", () => {
    expect(
      shouldQueueDeletion({
        retentionState: "active",
        deleteAfter: new Date("2026-05-20T00:00:00.000Z"),
        now: new Date("2026-05-21T00:00:00.000Z")
      })
    ).toBe(true)
    expect(defaultRetentionPolicy.rawFileRetentionDays).toBe(14)
  })
})
