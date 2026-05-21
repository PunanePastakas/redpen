export type ActiveWorkStatus =
  | "uploaded"
  | "transcribing"
  | "mapped"
  | "drafted"
  | "needs_review"
  | "reviewed"
  | "confirmed"
  | "shared"
  | "archived"
  | "error"

const removableStatuses = new Set<ActiveWorkStatus>(["uploaded", "needs_review", "reviewed", "error"])

export function canRemoveWorkFromActiveWorkflow(status: ActiveWorkStatus) {
  return removableStatuses.has(status)
}

export function selectNextWorkIdAfterRemoval<TWork extends { _id: string }>(works: TWork[], removedWorkId: TWork["_id"]): TWork["_id"] | null {
  if (works.length === 0) return null
  const removedIndex = works.findIndex((work) => work._id === removedWorkId)
  if (removedIndex === -1) return works[0]?._id ?? null

  return works[removedIndex + 1]?._id ?? works[removedIndex - 1]?._id ?? null
}
