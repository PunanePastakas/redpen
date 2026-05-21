import { describe, expect, it } from "vitest"
import { normalizeGradingAnalysisMath } from "@/lib/grading-analysis-normalization"
import { hasInvalidMathSpans, isValidKatex, normalizeMathLatex, parseMathText } from "@/lib/math-rendering"
import { syntheticAnalysis } from "@/lib/synthetic-demo"

describe("math rendering helpers", () => {
  it("validates KaTeX-compatible latex", () => {
    expect(isValidKatex("\\frac{x+1}{2}")).toBe(true)
    expect(normalizeMathLatex("  x^2 + 1  ")).toBe("x^2 + 1")
  })

  it("rejects invalid latex without throwing", () => {
    expect(isValidKatex("\\notacommand{")).toBe(false)
    expect(normalizeMathLatex("\\notacommand{")).toBeNull()
  })

  it("parses mixed prose and math spans", () => {
    const segments = parseMathText("Check \\(x^2\\) and \\[\\frac{x+1}{2}\\].")
    expect(segments.map((segment) => segment.type)).toEqual(["text", "math", "text", "math", "text"])
  })

  it("falls back to text for invalid math spans", () => {
    const segments = parseMathText("Bad \\(\\notacommand{\\) span")
    expect(segments).toContainEqual({ type: "text", value: "\\(\\notacommand{\\)" })
    expect(hasInvalidMathSpans("Bad \\(\\notacommand{\\) span")).toBe(true)
  })

  it("normalizes invalid analysis math and display spans and adds a review flag", () => {
    const analysis = structuredClone(syntheticAnalysis)
    analysis.transcription.tasks[0]!.text = "Bad span \\(\\notacommand{\\)"
    analysis.tasks[0]!.feedbackDraft = "Bad span \\(\\notacommand{\\)"

    const normalized = normalizeGradingAnalysisMath(analysis)

    expect(normalized.transcription.tasks[0]?.text).toBe("Bad span \\(\\notacommand{\\)")
    expect(normalized.reviewFlags).toContain("unclear_transcription")
  })
})
