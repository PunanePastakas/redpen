import { describe, expect, it } from "vitest"
import { hashAnalysisInput, makeProviderMetadata } from "@/lib/ai/provider"

describe("OpenAI provider boundary", () => {
  it("pins provider metadata to storeResponses=false", () => {
    expect(makeProviderMetadata({ model: "gpt-5.5" }).storeResponses).toBe(false)
  })

  it("records Azure OpenAI provider metadata", () => {
    const metadata = makeProviderMetadata({
      provider: "azure_openai",
      model: "gpt-5-5-eu",
      endpoint: "https://redpen.openai.azure.com",
      apiVersion: "2025-04-01-preview",
      dataControlMode: "azure_no_training_store_false",
      dataResidencyRegion: "sweden-central"
    })

    expect(metadata).toMatchObject({
      provider: "azure_openai",
      model: "gpt-5-5-eu",
      apiVersion: "2025-04-01-preview",
      storeResponses: false
    })
  })

  it("hashes analysis inputs without raw image bytes in the audit key", async () => {
    const hash = await hashAnalysisInput({
      provider: "azure_openai",
      model: "gpt-5.5",
      purpose: "full_document_analysis",
      testTitle: "Synthetic test",
      feedbackLanguage: "et",
      pages: [{ pageNumber: 1, mimeType: "image/png", imageDataUrl: "data:image/png;base64,abc", sha256: "abc" }]
    })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})
