import { v } from "convex/values"
import type { FunctionReference } from "convex/server"
import { action, internalAction, internalMutation, type ActionCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  GRADING_ANALYSIS_SCHEMA_VERSION,
  GUIDE_TASK_MODEL_SCHEMA_VERSION,
  GradingAnalysisJsonSchema,
  GradingAnalysisSchema,
  GuideTaskModelJsonSchema,
  GuideTaskModelSchema,
  type GradingAnalysis,
  type GuideTaskModel
} from "../lib/ai-schemas"
import {
  buildAnalysisPrompt,
  buildGuideTaskModelPrompt,
  buildGuideTaskModelSystemPrompt,
  buildSystemPrompt,
  EXPECTED_TASK_GRADING_ANALYSIS_PROMPT_VERSION,
  GRADING_ANALYSIS_PROMPT_VERSION,
  GUIDE_TASK_MODEL_PROMPT_VERSION,
  summarizeExpectedTasksForPrompt
} from "../lib/ai/prompts"
import {
  buildExpectedTaskAnalysisContract,
  EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION,
  taskModelEntriesFromGuideTaskModel,
  type ExpectedTaskModelTask
} from "../lib/ai/dynamic-analysis-schema"
import { normalizeGradingAnalysisMath } from "../lib/grading-analysis-normalization"
import { sha256Hex } from "./crypto"
import { syntheticAnalysisForConvex, syntheticGuideTaskModelForConvex } from "./syntheticAnalysis"
import { AuthorizationError, requireIdentity } from "./auth"

type UploadForAi = {
  _id: Id<"uploadedFiles">
  storageId: Id<"_storage">
  role: "student_work" | "grading_context" | "derived_page" | "derived_crop"
  filename: string
  mimeType: string
  sha256: string
  fileKind: "image" | "pdf" | "text" | "unknown"
}

type InputRef = {
  role: "grading_context" | "student_work"
  uploadId: Id<"uploadedFiles">
  storageId: Id<"_storage">
  filename: string
  mimeType: string
  sha256: string
  transport: "convex_url" | "text"
}

type ResponseContentItem =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; file_url: string }

type LiveProviderConfig = {
  provider: "openai" | "azure_openai"
  endpoint: string
  responsesUrl: string
  apiKey: string | undefined
  apiVersion?: string
  model: string
  dataControlMode: string
  dataResidencyRegion?: string
  deploymentType?: string
  contentLoggingDisabled?: boolean
}

const EU_AZURE_REGIONS = new Set(["sweden-central", "swedencentral", "france-central", "francecentral", "germany-west-central", "germanywestcentral", "westeurope", "west-europe", "northeurope", "north-europe", "europe"])
const SAFE_AZURE_DEPLOYMENT_TYPES = new Set(["standard", "datazone-standard", "provisioned-managed"])

type AiInputData = {
  work: Doc<"studentWorks">
  test: Doc<"tests">
  uploads: UploadForAi[]
  contextUploads: UploadForAi[]
  testTasks: TestTaskForAi[]
}

type TestTaskForAi = {
  _id: Id<"testTasks">
  stableKey: string
  label: string
  maxPoints?: number
  criteria?: unknown
  source: string
  order: number
}

type RecordAttemptStartedArgs = {
  teacherId: Id<"users">
  testId?: Id<"tests">
  workId?: Id<"studentWorks">
  taskReviewId?: Id<"taskReviews">
  provider: string
  endpoint: string
  dataControlMode: string
  dataResidencyRegion?: string
  model: string
  apiVersion?: string
  deploymentType?: string
  contentLoggingDisabled?: boolean
  promptVersion: string
  schemaVersion: string
  purpose: string
  inputHash?: string
}

const aiActionRefs = internal.aiActions as unknown as {
  recordAttemptStarted: FunctionReference<"mutation", "internal", RecordAttemptStartedArgs, Id<"aiAttempts">>
  recordAttemptCompleted: FunctionReference<"mutation", "internal", { attemptId: Id<"aiAttempts">; outputHash: string }, null>
  recordAttemptFailed: FunctionReference<"mutation", "internal", { attemptId: Id<"aiAttempts">; error: string }, null>
}

export const analyzeWork = action({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args): Promise<GradingAnalysis> => {
    const teacherId = await requireIdentity(ctx)
    const { work } = (await ctx.runQuery(internal.works.getForAi, { workId: args.workId })) as AiInputData
    if (work.teacherId !== teacherId) {
      throw new AuthorizationError("Student work is not owned by the current teacher")
    }
    return await analyzeWorkNow(ctx, args.workId)
  }
})

export const analyzeWorkInternal = internalAction({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args): Promise<GradingAnalysis> => {
    return await analyzeWorkNow(ctx, args.workId)
  }
})

async function analyzeWorkNow(ctx: ActionCtx, workId: Id<"studentWorks">): Promise<GradingAnalysis> {
  const aiInput = (await ctx.runQuery(internal.works.getForAi, { workId })) as AiInputData
  const { work, test, uploads, contextUploads } = aiInput
  const workUploads = uploads.filter((upload) => upload.role === "student_work")
  const gradingContextUploads = contextUploads.filter((upload) => upload.role === "grading_context")
  const expectedTasks = gradingContextUploads.length > 0 ? expectedTasksFromTestTasks(aiInput) : []
  if (gradingContextUploads.length > 0 && expectedTasks.length === 0) {
    const message = "The grading guide task model is not ready yet"
    await ctx.runMutation(internal.works.setStatusForAi, { workId: work._id, status: "error", error: message })
    throw new Error(message)
  }
  const providerMode = process.env.REDPEN_AI_PROVIDER ?? "openai"
  const providerConfig = resolveLiveProviderConfig(providerMode, "analysis")
  const inputRefs = makeInputRefs([...gradingContextUploads, ...workUploads])
  const promptVersion = expectedTasks.length > 0 ? EXPECTED_TASK_GRADING_ANALYSIS_PROMPT_VERSION : GRADING_ANALYSIS_PROMPT_VERSION
  const schemaVersion = expectedTasks.length > 0 ? EXPECTED_TASK_GRADING_ANALYSIS_SCHEMA_VERSION : GRADING_ANALYSIS_SCHEMA_VERSION
  const inputHash = await sha256Hex(
    JSON.stringify({
      workId: work._id,
      testId: work.testId,
      model: providerConfig.model,
      providerMode,
      promptVersion,
      schemaVersion,
      inputRefs,
      expectedTasks
    })
  )
  const attemptId = (await ctx.runMutation(aiActionRefs.recordAttemptStarted, {
    teacherId: work.teacherId,
    testId: work.testId,
    workId: work._id,
    provider: providerMode === "mock" ? "mock" : providerConfig.provider,
    endpoint: providerMode === "mock" ? "mock" : providerConfig.endpoint,
    dataControlMode: providerMode === "mock" ? "synthetic_fixture_only" : providerConfig.dataControlMode,
    dataResidencyRegion: providerMode === "mock" ? undefined : providerConfig.dataResidencyRegion,
    model: providerMode === "mock" ? "synthetic" : providerConfig.model,
    apiVersion: providerMode === "mock" ? undefined : providerConfig.apiVersion,
    deploymentType: providerMode === "mock" ? undefined : providerConfig.deploymentType,
    contentLoggingDisabled: providerMode === "mock" ? undefined : providerConfig.contentLoggingDisabled,
    promptVersion,
    schemaVersion,
    purpose: expectedTasks.length > 0 ? "full_document_analysis_with_expected_tasks" : "full_document_analysis",
    inputHash
  })) as Id<"aiAttempts">

  try {
    if (workUploads.length === 0) {
      throw new Error("No student work uploads are attached to this work")
    }

    const analysis: GradingAnalysis =
      providerMode === "mock"
        ? normalizeGradingAnalysisMath(GradingAnalysisSchema.parse(syntheticAnalysisForConvex(test.defaultFeedbackLanguage, expectedTasks)))
        : await callOpenAIResponses(ctx, {
            providerConfig,
            testTitle: test.title,
            feedbackLanguage: test.defaultFeedbackLanguage,
            teacherNotes: test.notes,
            workUploads,
            gradingContextUploads,
            expectedTasks
          })

    await ctx.runMutation(internal.works.applyAnalysisDraft, {
      workId: work._id,
      fullTranscription: analysis.transcription,
      studentName: analysis.studentName,
      generalFeedback: analysis.generalFeedback,
      suggestedTotalPoints: analysis.suggestedTotalPoints,
      maxPoints: analysis.maxPoints,
      suggestedGrade: analysis.suggestedGrade,
      reviewFlags: analysis.reviewFlags,
      tasks: analysis.tasks,
      annotationTargets: analysis.annotationTargets
    })

    await ctx.runMutation(aiActionRefs.recordAttemptCompleted, {
      attemptId,
      outputHash: await sha256Hex(JSON.stringify(analysis))
    })

    return analysis
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed"
    await ctx.runMutation(aiActionRefs.recordAttemptFailed, { attemptId, error: message })
    await ctx.runMutation(internal.works.setStatusForAi, { workId: work._id, status: "error", error: message })
    throw error
  }
}

export const extractTaskModelInternal = internalAction({
  args: { testId: v.id("tests") },
  handler: async (ctx, args): Promise<GuideTaskModel> => {
    return await extractTaskModelNow(ctx, args.testId)
  }
})

async function extractTaskModelNow(ctx: ActionCtx, testId: Id<"tests">): Promise<GuideTaskModel> {
  const { test, contextUploads } = (await ctx.runQuery(internal.tests.getForTaskModelExtraction, { testId })) as {
    test: Doc<"tests">
    contextUploads: UploadForAi[]
  }
  const gradingContextUploads = contextUploads.filter((upload) => upload.role === "grading_context")
  if (gradingContextUploads.length === 0) {
    throw new Error("No grading guide uploads are attached to this test")
  }

  const providerMode = process.env.REDPEN_AI_PROVIDER ?? "openai"
  const providerConfig = resolveLiveProviderConfig(providerMode, "task_model")
  const inputRefs = makeInputRefs(gradingContextUploads)
  const inputHash = await sha256Hex(
    JSON.stringify({
      testId: test._id,
      model: providerConfig.model,
      providerMode,
      promptVersion: GUIDE_TASK_MODEL_PROMPT_VERSION,
      schemaVersion: GUIDE_TASK_MODEL_SCHEMA_VERSION,
      inputRefs
    })
  )

  await ctx.runMutation(internal.tests.markTaskModelExtractionStarted, { testId: test._id, sourceHash: inputHash })

  const attemptId = (await ctx.runMutation(aiActionRefs.recordAttemptStarted, {
    teacherId: test.teacherId,
    testId: test._id,
    provider: providerMode === "mock" ? "mock" : providerConfig.provider,
    endpoint: providerMode === "mock" ? "mock" : providerConfig.endpoint,
    dataControlMode: providerMode === "mock" ? "synthetic_fixture_only" : providerConfig.dataControlMode,
    dataResidencyRegion: providerMode === "mock" ? undefined : providerConfig.dataResidencyRegion,
    model: providerMode === "mock" ? "synthetic" : providerConfig.model,
    apiVersion: providerMode === "mock" ? undefined : providerConfig.apiVersion,
    deploymentType: providerMode === "mock" ? undefined : providerConfig.deploymentType,
    contentLoggingDisabled: providerMode === "mock" ? undefined : providerConfig.contentLoggingDisabled,
    promptVersion: GUIDE_TASK_MODEL_PROMPT_VERSION,
    schemaVersion: GUIDE_TASK_MODEL_SCHEMA_VERSION,
    purpose: "task_model_extraction",
    inputHash
  })) as Id<"aiAttempts">

  try {
    const guideTaskModel =
      providerMode === "mock"
        ? GuideTaskModelSchema.parse(syntheticGuideTaskModelForConvex())
        : await callOpenAIForTaskModel(ctx, {
            providerConfig,
            testTitle: test.title,
            teacherNotes: test.notes,
            gradingContextUploads
          })

    await ctx.runMutation(internal.tests.replaceTaskModelForAi, {
      teacherId: test.teacherId,
      testId: test._id,
      taskModel: taskModelEntriesForConvex(guideTaskModel),
      sourceHash: inputHash
    })

    await ctx.runMutation(aiActionRefs.recordAttemptCompleted, {
      attemptId,
      outputHash: await sha256Hex(JSON.stringify(guideTaskModel))
    })

    return guideTaskModel
  } catch (error) {
    const message = error instanceof Error ? error.message : "Guide task model extraction failed"
    await ctx.runMutation(aiActionRefs.recordAttemptFailed, { attemptId, error: message })
    await ctx.runMutation(internal.tests.markTaskModelExtractionFailed, { testId: test._id, sourceHash: inputHash, error: message })
    throw error
  }
}

async function callOpenAIResponses(
  ctx: ActionCtx,
  input: {
    providerConfig: LiveProviderConfig
    testTitle: string
    feedbackLanguage: "et" | "en"
    teacherNotes?: string
    workUploads: UploadForAi[]
    gradingContextUploads: UploadForAi[]
    expectedTasks: ExpectedTaskModelTask[]
  }
): Promise<GradingAnalysis> {
  requireProviderApiKey(input.providerConfig)

  const expectedContract = input.expectedTasks.length > 0 ? buildExpectedTaskAnalysisContract(input.expectedTasks) : null
  const userContent: ResponseContentItem[] = [
    {
      type: "input_text",
      text: buildAnalysisPrompt({
        testTitle: input.testTitle,
        feedbackLanguage: input.feedbackLanguage,
        teacherNotes: input.teacherNotes,
        gradingContextSummary:
          input.gradingContextUploads.length > 0
            ? `${input.gradingContextUploads.length} Hindamisjuhend / grading guide file(s) are attached below. Use them as rubric/context, not as student work.`
            : undefined,
        expectedTaskModelSummary: input.expectedTasks.length > 0 ? summarizeExpectedTasksForPrompt(input.expectedTasks) : undefined
      })
    }
  ]

  for (const upload of input.gradingContextUploads) {
    await appendUploadContent(ctx, userContent, upload, "Hindamisjuhend / grading guide")
  }

  for (const upload of input.workUploads) {
    await appendUploadContent(ctx, userContent, upload, "Student work")
  }

  const response = await fetch(input.providerConfig.responsesUrl, {
    method: "POST",
    headers: providerHeaders(input.providerConfig),
    body: JSON.stringify({
      model: input.providerConfig.model,
      store: false,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: buildSystemPrompt() }]
        },
        {
          role: "user",
          content: userContent
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: expectedContract?.name ?? "grading_analysis",
          strict: true,
          schema: expectedContract?.jsonSchema ?? GradingAnalysisJsonSchema
        }
      }
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI Responses API failed with ${response.status}: ${body.slice(0, 600)}`)
  }

  const payload = await response.json()
  const rawText = extractOutputText(payload)
  if (!rawText) {
    throw new Error("OpenAI response did not include output_text")
  }

  const parsed = JSON.parse(rawText)
  return normalizeGradingAnalysisMath(expectedContract ? expectedContract.parse(parsed) : GradingAnalysisSchema.parse(parsed))
}

async function callOpenAIForTaskModel(
  ctx: ActionCtx,
  input: {
    providerConfig: LiveProviderConfig
    testTitle: string
    teacherNotes?: string
    gradingContextUploads: UploadForAi[]
  }
): Promise<GuideTaskModel> {
  requireProviderApiKey(input.providerConfig)

  const userContent: ResponseContentItem[] = [
    {
      type: "input_text",
      text: buildGuideTaskModelPrompt({
        testTitle: input.testTitle,
        teacherNotes: input.teacherNotes
      })
    }
  ]

  for (const upload of input.gradingContextUploads) {
    await appendUploadContent(ctx, userContent, upload, "Hindamisjuhend / grading guide")
  }

  const response = await fetch(input.providerConfig.responsesUrl, {
    method: "POST",
    headers: providerHeaders(input.providerConfig),
    body: JSON.stringify({
      model: input.providerConfig.model,
      store: false,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: buildGuideTaskModelSystemPrompt() }]
        },
        {
          role: "user",
          content: userContent
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "guide_task_model",
          strict: true,
          schema: GuideTaskModelJsonSchema
        }
      }
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI Responses API failed with ${response.status}: ${body.slice(0, 600)}`)
  }

  const payload = await response.json()
  const rawText = extractOutputText(payload)
  if (!rawText) {
    throw new Error("OpenAI response did not include output_text")
  }

  return GuideTaskModelSchema.parse(JSON.parse(rawText))
}

async function appendUploadContent(ctx: ActionCtx, content: ResponseContentItem[], upload: UploadForAi, label: string) {
  content.push({
    type: "input_text",
    text: `${label}: ${upload.filename} (${upload.mimeType}, sha256 ${upload.sha256})`
  })

  if (upload.fileKind === "text" || upload.mimeType === "text/plain") {
    const blob = await ctx.storage.get(upload.storageId)
    content.push({
      type: "input_text",
      text: blob ? await blob.text() : "Text upload could not be loaded from storage."
    })
    return
  }

  const url = await ctx.storage.getUrl(upload.storageId)
  if (!url) {
    throw new Error(`Could not create a storage URL for ${upload.filename}`)
  }

  if (upload.fileKind === "pdf" || upload.mimeType === "application/pdf") {
    content.push({ type: "input_file", file_url: url })
    return
  }

  if (upload.fileKind === "image" || upload.mimeType.startsWith("image/")) {
    content.push({ type: "input_image", image_url: url })
    return
  }

  content.push({ type: "input_file", file_url: url })
}

function makeInputRefs(uploads: UploadForAi[]): InputRef[] {
  return uploads
    .filter((upload): upload is UploadForAi & { role: "grading_context" | "student_work" } => upload.role === "grading_context" || upload.role === "student_work")
    .map((upload) => ({
      role: upload.role,
      uploadId: upload._id,
      storageId: upload.storageId,
      filename: upload.filename,
      mimeType: upload.mimeType,
      sha256: upload.sha256,
      transport: upload.fileKind === "text" || upload.mimeType === "text/plain" ? "text" : "convex_url"
    }))
}

function resolveLiveProviderConfig(providerMode: string, purpose: "analysis" | "task_model"): LiveProviderConfig {
  if (providerMode === "openai") {
    const endpoint = process.env.OPENAI_BASE_URL || "https://api.openai.com"
    return {
      provider: "openai",
      endpoint,
      responsesUrl: openAIResponsesEndpoint(endpoint),
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      dataControlMode: "store_false",
      dataResidencyRegion: endpoint === "https://eu.api.openai.com" ? "europe" : undefined
    }
  }

  if (providerMode === "azure_openai") {
    const endpoint = requireAzureEndpoint(process.env.AZURE_OPENAI_ENDPOINT)
    const deploymentType = normalizeAzureValue(process.env.AZURE_OPENAI_DEPLOYMENT_TYPE)
    const region = normalizeAzureValue(process.env.AZURE_OPENAI_REGION)
    const contentLoggingDisabled = process.env.AZURE_OPENAI_CONTENT_LOGGING_DISABLED === "true"
    validateAzureRuntime({ region, deploymentType, contentLoggingDisabled })

    return {
      provider: "azure_openai",
      endpoint,
      responsesUrl: azureResponsesEndpoint(endpoint),
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      model: azureDeploymentName(purpose),
      dataControlMode: process.env.AZURE_OPENAI_DATA_CONTROL_MODE || "azure_no_training_store_false",
      dataResidencyRegion: region,
      deploymentType,
      contentLoggingDisabled
    }
  }

  if (providerMode === "mock") {
    return {
      provider: "openai",
      endpoint: "mock",
      responsesUrl: "mock",
      apiKey: "mock",
      model: "synthetic",
      dataControlMode: "synthetic_fixture_only"
    }
  }

  throw new Error(`Unsupported REDPEN_AI_PROVIDER: ${providerMode}`)
}

function azureDeploymentName(purpose: "analysis" | "task_model") {
  const specific = purpose === "task_model" ? process.env.AZURE_OPENAI_TASK_MODEL_DEPLOYMENT : process.env.AZURE_OPENAI_ANALYSIS_DEPLOYMENT
  const deployment = specific || process.env.AZURE_OPENAI_DEPLOYMENT
  if (!deployment) {
    throw new Error("AZURE_OPENAI_DEPLOYMENT or a purpose-specific Azure OpenAI deployment name must be configured")
  }
  return deployment
}

function requireAzureEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT must be configured in Convex backend environment")
  }

  let parsed: URL
  try {
    parsed = new URL(endpoint)
  } catch {
    throw new Error("AZURE_OPENAI_ENDPOINT must be a valid HTTPS Azure OpenAI URL")
  }

  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".openai.azure.com")) {
    throw new Error("AZURE_OPENAI_ENDPOINT must use HTTPS and an *.openai.azure.com host")
  }

  return endpoint
}

function validateAzureRuntime(input: { region?: string; deploymentType?: string; contentLoggingDisabled: boolean }) {
  if (!input.region || !EU_AZURE_REGIONS.has(input.region)) {
    throw new Error("AZURE_OPENAI_REGION must be an approved EU Azure region")
  }

  if (!input.deploymentType || !SAFE_AZURE_DEPLOYMENT_TYPES.has(input.deploymentType)) {
    throw new Error("AZURE_OPENAI_DEPLOYMENT_TYPE must be Standard, DataZoneStandard, or ProvisionedManaged for RedPen")
  }

  if (!input.contentLoggingDisabled) {
    throw new Error("AZURE_OPENAI_CONTENT_LOGGING_DISABLED must be true for RedPen")
  }
}

function normalizeAzureValue(value: string | undefined) {
  return value?.toLowerCase().replace(/\s+/g, "").replace(/_/g, "-")
}

function requireProviderApiKey(config: LiveProviderConfig) {
  if (config.provider === "azure_openai" && (!process.env.AZURE_OPENAI_ENDPOINT || !config.apiKey)) {
    throw new Error("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be configured in Convex backend environment")
  }

  if (config.provider === "openai" && !config.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Convex backend environment")
  }
}

function providerHeaders(config: LiveProviderConfig): Record<string, string> {
  if (config.provider === "azure_openai") {
    return {
      "api-key": config.apiKey ?? "",
      "Content-Type": "application/json"
    }
  }

  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json"
  }
}

function openAIResponsesEndpoint(endpoint: string) {
  const normalized = endpoint.replace(/\/+$/, "")
  return normalized.endsWith("/v1") ? `${normalized}/responses` : `${normalized}/v1/responses`
}

function azureResponsesEndpoint(endpoint: string) {
  const normalized = endpoint.replace(/\/+$/, "")
  const base = normalized.endsWith("/openai/v1") ? normalized : `${normalized}/openai/v1`
  return `${base}/responses`
}

function extractOutputText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return null
  if ("output_text" in payload && typeof payload.output_text === "string") return payload.output_text
  const output = "output" in payload && Array.isArray(payload.output) ? payload.output : []
  for (const item of output) {
    if (typeof item !== "object" || item === null || !("content" in item) || !Array.isArray(item.content)) continue
    for (const content of item.content) {
      if (typeof content === "object" && content !== null && "text" in content && typeof content.text === "string") {
        return content.text
      }
    }
  }
  return null
}

function expectedTasksFromTestTasks(input: AiInputData): ExpectedTaskModelTask[] {
  const metadataByStableKey = new Map(
    input.test.taskModel.map((task) => [
      task.stableKey,
      {
        likelyTaskNumber: "likelyTaskNumber" in task ? task.likelyTaskNumber ?? null : null,
        sourceRefs: "sourceRefs" in task && Array.isArray(task.sourceRefs) ? task.sourceRefs : [],
        extractionWarnings: "extractionWarnings" in task && Array.isArray(task.extractionWarnings) ? task.extractionWarnings : [],
        criteria: "criteria" in task ? task.criteria : null
      }
    ])
  )

  return input.testTasks
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((task) => {
      const criteriaMetadata = isRecord(task.criteria) ? task.criteria : {}
      const cachedMetadata = metadataByStableKey.get(task.stableKey)
      return {
        stableKey: task.stableKey,
        label: task.label,
        likelyTaskNumber: stringOrNull(criteriaMetadata.likelyTaskNumber) ?? cachedMetadata?.likelyTaskNumber ?? null,
        maxPoints: task.maxPoints ?? null,
        criteria: "value" in criteriaMetadata ? criteriaMetadata.value : cachedMetadata?.criteria ?? task.criteria ?? null,
        sourceRefs: Array.isArray(criteriaMetadata.sourceRefs)
          ? criteriaMetadata.sourceRefs as ExpectedTaskModelTask["sourceRefs"]
          : cachedMetadata?.sourceRefs ?? [],
        extractionWarnings: Array.isArray(criteriaMetadata.extractionWarnings)
          ? criteriaMetadata.extractionWarnings.filter((warning): warning is string => typeof warning === "string")
          : cachedMetadata?.extractionWarnings ?? [],
        source: task.source,
        order: task.order
      }
    })
}

function taskModelEntriesForConvex(model: GuideTaskModel) {
  return taskModelEntriesFromGuideTaskModel(model).map((task) => ({
    stableKey: task.stableKey,
    label: task.label,
    likelyTaskNumber: task.likelyTaskNumber ?? null,
    ...(typeof task.maxPoints === "number" ? { maxPoints: task.maxPoints } : {}),
    criteria: task.criteria ?? null,
    sourceRefs: task.sourceRefs ?? [],
    extractionWarnings: task.extractionWarnings ?? [],
    source: "guidance_document",
    order: task.order
  }))
}

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export const recordAttemptStarted = internalMutation({
  args: {
    teacherId: v.id("users"),
    testId: v.optional(v.id("tests")),
    workId: v.optional(v.id("studentWorks")),
    taskReviewId: v.optional(v.id("taskReviews")),
    provider: v.string(),
    endpoint: v.string(),
    dataControlMode: v.string(),
    dataResidencyRegion: v.optional(v.string()),
    model: v.string(),
    apiVersion: v.optional(v.string()),
    deploymentType: v.optional(v.string()),
    contentLoggingDisabled: v.optional(v.boolean()),
    promptVersion: v.string(),
    schemaVersion: v.string(),
    purpose: v.string(),
    inputHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiAttempts", {
      ...args,
      status: "started",
      startedAt: new Date().toISOString()
    })
  }
})

export const recordAttemptCompleted = internalMutation({
  args: {
    attemptId: v.id("aiAttempts"),
    outputHash: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.attemptId, {
      status: "completed",
      outputHash: args.outputHash,
      completedAt: new Date().toISOString()
    })
  }
})

export const recordAttemptFailed = internalMutation({
  args: {
    attemptId: v.id("aiAttempts"),
    error: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.attemptId, {
      status: "failed",
      error: args.error,
      completedAt: new Date().toISOString()
    })
  }
})
