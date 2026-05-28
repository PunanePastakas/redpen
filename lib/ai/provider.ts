import type { FeedbackLanguage, GradingAnalysis } from "@/lib/ai-schemas"
import { GRADING_ANALYSIS_SCHEMA_VERSION } from "@/lib/ai-schemas"
import { GRADING_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/prompts"
import { sha256Hex } from "@/lib/hashing"

export type AIProviderName = "openai" | "azure_openai"

export type AIPageInput = {
  pageNumber: number
  mimeType: "image/png" | "image/jpeg" | "application/pdf" | "text/plain"
  imageDataUrl?: string
  text?: string
  storageId?: string
  sha256?: string
}

export type AnalyzeDocumentRequest = {
  provider: AIProviderName
  model: string
  purpose: "full_document_analysis" | "crop_refinement"
  testTitle: string
  feedbackLanguage: FeedbackLanguage
  teacherNotes?: string
  gradingContextText?: string
  pages: AIPageInput[]
}

export type AIProviderMetadata = {
  provider: AIProviderName
  endpoint: string
  dataControlMode: string
  dataResidencyRegion: string | null
  model: string
  apiVersion: string | null
  promptVersion: string
  schemaVersion: string
  storeResponses: false
}

export type AnalyzeDocumentResponse = {
  analysis: GradingAnalysis
  metadata: AIProviderMetadata
  inputHash: string
  outputHash: string
}

export interface RedPenAIProvider {
  analyzeDocument(request: AnalyzeDocumentRequest): Promise<AnalyzeDocumentResponse>
}

export async function hashAnalysisInput(request: AnalyzeDocumentRequest) {
  return sha256Hex(
    JSON.stringify({
      provider: request.provider,
      model: request.model,
      purpose: request.purpose,
      testTitle: request.testTitle,
      feedbackLanguage: request.feedbackLanguage,
      teacherNotes: request.teacherNotes ?? null,
      gradingContextText: request.gradingContextText ?? null,
      pages: request.pages.map((page) => ({
        pageNumber: page.pageNumber,
        mimeType: page.mimeType,
        storageId: page.storageId ?? null,
        sha256: page.sha256 ?? null,
        text: page.text ?? null,
        hasImageDataUrl: Boolean(page.imageDataUrl)
      }))
    })
  )
}

export async function hashAnalysisOutput(analysis: GradingAnalysis) {
  return sha256Hex(JSON.stringify(analysis))
}

export function makeProviderMetadata(input: {
  provider?: AIProviderName
  model: string
  endpoint?: string
  dataControlMode?: string
  dataResidencyRegion?: string | null
  apiVersion?: string | null
}): AIProviderMetadata {
  return {
    provider: input.provider ?? "openai",
    endpoint: input.endpoint ?? "https://api.openai.com",
    dataControlMode: input.dataControlMode ?? "default",
    dataResidencyRegion: input.dataResidencyRegion ?? null,
    model: input.model,
    apiVersion: input.apiVersion ?? null,
    promptVersion: GRADING_ANALYSIS_PROMPT_VERSION,
    schemaVersion: GRADING_ANALYSIS_SCHEMA_VERSION,
    storeResponses: false
  }
}
