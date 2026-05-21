import { describe, expect, it } from "vitest"
import { hashAnalysisInput, makeProviderMetadata } from "@/lib/ai/provider"

describe("OpenAI provider boundary", () => {
  it("pins provider metadata to storeResponses=false", () => {
    expect(makeProviderMetadata({ model: "gpt-5.5" }).storeResponses).toBe(false)
  })

  it("hashes analysis inputs without raw image bytes in the audit key", async () => {
    const hash = await hashAnalysisInput({
      provider: "openai",
      model: "gpt-5.5",
      purpose: "full_document_analysis",
      testTitle: "Synthetic test",
      feedbackLanguage: "et",
      pages: [{ pageNumber: 1, mimeType: "image/png", imageDataUrl: "data:image/png;base64,abc", sha256: "abc" }]
    })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})
