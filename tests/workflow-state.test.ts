import { describe, expect, it } from "vitest"
import { canRemoveWorkFromActiveWorkflow, selectNextWorkIdAfterRemoval } from "@/lib/workflow-state"

describe("workflow state helpers", () => {
  it("allows reversible removal only for active non-running work states", () => {
    expect(canRemoveWorkFromActiveWorkflow("uploaded")).toBe(true)
    expect(canRemoveWorkFromActiveWorkflow("needs_review")).toBe(true)
    expect(canRemoveWorkFromActiveWorkflow("error")).toBe(true)
    expect(canRemoveWorkFromActiveWorkflow("transcribing")).toBe(false)
    expect(canRemoveWorkFromActiveWorkflow("confirmed")).toBe(false)
    expect(canRemoveWorkFromActiveWorkflow("shared")).toBe(false)
  })

  it("selects the next visible work after removing the current one", () => {
    const works = [{ _id: "first" }, { _id: "second" }, { _id: "third" }]

    expect(selectNextWorkIdAfterRemoval(works, "second")).toBe("third")
    expect(selectNextWorkIdAfterRemoval(works, "third")).toBe("second")
    expect(selectNextWorkIdAfterRemoval(works, "missing")).toBe("first")
    expect(selectNextWorkIdAfterRemoval(works.slice(0, 0), "missing")).toBeNull()
  })
})
