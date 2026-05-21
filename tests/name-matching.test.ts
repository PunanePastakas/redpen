import { describe, expect, it } from "vitest"
import { normalizeName, scoreNameMatch, suggestStudentMatches } from "@/lib/name-matching"

describe("name matching", () => {
  it("normalizes Estonian names for stable matching", () => {
    expect(normalizeName("  Õie  Tamm  ")).toBe("oie tamm")
  })

  it("scores exact and partial matches", () => {
    expect(scoreNameMatch("Ada Tamm", "Ada Tamm")).toBe(1)
    expect(scoreNameMatch("Ada", "Ada Tamm")).toBeGreaterThan(0.7)
  })

  it("sorts advisory suggestions by confidence", () => {
    const suggestions = suggestStudentMatches("Ada Tamm", [
      { id: "1", displayName: "Mart Kask" },
      { id: "2", displayName: "Ada Tamm" }
    ])
    expect(suggestions[0]?.studentId).toBe("2")
  })
})
