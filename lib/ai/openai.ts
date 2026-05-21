import OpenAI from "openai"
import { GradingAnalysisJsonSchema, GradingAnalysisSchema } from "@/lib/ai-schemas"
import { normalizeGradingAnalysisMath } from "@/lib/grading-analysis-normalization"
import { buildAnalysisPrompt, buildSystemPrompt } from "@/lib/ai/prompts"
import {
  AnalyzeDocumentRequest,
  AnalyzeDocumentResponse,
  RedPenAIProvider,
  hashAnalysisInput,
  hashAnalysisOutput,
  makeProviderMetadata
} from "@/lib/ai/provider"

type OpenAIProviderOptions = {
  apiKey: string
  project?: string
  model: string
  baseURL?: string
  dataControlMode?: string
  dataResidencyRegion?: string | null
}

export class OpenAIRedPenProvider implements RedPenAIProvider {
  private readonly client: OpenAI
  private readonly options: OpenAIProviderOptions

  constructor(options: OpenAIProviderOptions) {
    this.options = options
    this.client = new OpenAI({
      apiKey: options.apiKey,
      project: options.project,
      baseURL: options.baseURL
    })
  }

  async analyzeDocument(request: AnalyzeDocumentRequest): Promise<AnalyzeDocumentResponse> {
    const inputHash = await hashAnalysisInput(request)
    const response = await this.client.responses.create({
      model: this.options.model,
      store: false,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: buildSystemPrompt() }]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildAnalysisPrompt({
                testTitle: request.testTitle,
                feedbackLanguage: request.feedbackLanguage,
                teacherNotes: request.teacherNotes,
                gradingContextSummary: request.gradingContextText
              })
            },
            ...request.pages.flatMap((page) => {
              if (page.imageDataUrl) {
                return [
                  { type: "input_text", text: `Student work page ${page.pageNumber}` },
                  { type: "input_image", image_url: page.imageDataUrl }
                ]
              }

              return [
                {
                  type: "input_text",
                  text: `Student work page ${page.pageNumber}: ${page.text ?? "No extracted text available."}`
                }
              ]
            })
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "grading_analysis",
          strict: true,
          schema: GradingAnalysisJsonSchema
        }
      }
    } as OpenAI.Responses.ResponseCreateParamsNonStreaming)

    const rawText = response.output_text
    if (!rawText) {
      throw new Error("OpenAI response did not include output_text")
    }

    const parsed = normalizeGradingAnalysisMath(GradingAnalysisSchema.parse(JSON.parse(rawText)))
    const outputHash = await hashAnalysisOutput(parsed)

    return {
      analysis: parsed,
      inputHash,
      outputHash,
      metadata: makeProviderMetadata({
        model: this.options.model,
        endpoint: this.options.baseURL,
        dataControlMode: this.options.dataControlMode,
        dataResidencyRegion: this.options.dataResidencyRegion
      })
    }
  }
}
