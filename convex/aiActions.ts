import { v } from "convex/values"
import type { FunctionReference } from "convex/server"
import { action, internalAction, internalMutation, type ActionCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import { REDPEN_AI_SCHEMA_VERSION, RedPenAnalysisJsonSchema, RedPenAnalysisSchema, type RedPenAnalysis } from "../lib/ai-schemas"
import { buildAnalysisPrompt, buildSystemPrompt, REDPEN_ANALYSIS_PROMPT_VERSION } from "../lib/ai/prompts"
import { sha256Hex } from "./crypto"
import { syntheticAnalysisForConvex } from "./syntheticAnalysis"
import { requireIdentity } from "./auth"

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

type AiInputData = {
  work: Doc<"studentWorks">
  test: Doc<"tests">
  uploads: UploadForAi[]
  contextUploads: UploadForAi[]
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
  handler: async (ctx, args): Promise<RedPenAnalysis> => {
    await requireIdentity(ctx)
    return await analyzeWorkNow(ctx, args.workId)
  }
})

export const analyzeWorkInternal = internalAction({
  args: { workId: v.id("studentWorks") },
  handler: async (ctx, args): Promise<RedPenAnalysis> => {
    return await analyzeWorkNow(ctx, args.workId)
  }
})

async function analyzeWorkNow(ctx: ActionCtx, workId: Id<"studentWorks">): Promise<RedPenAnalysis> {
  const { work, test, uploads, contextUploads } = (await ctx.runQuery(internal.works.getForAi, { workId })) as AiInputData
  const workUploads = uploads.filter((upload) => upload.role === "student_work")
  const gradingContextUploads = contextUploads.filter((upload) => upload.role === "grading_context")
  const providerMode = process.env.REDPEN_AI_PROVIDER ?? "openai"
  const endpoint = process.env.OPENAI_BASE_URL || "https://api.openai.com"
  const model = process.env.OPENAI_MODEL || "gpt-5.5"
  const inputRefs = makeInputRefs([...gradingContextUploads, ...workUploads])
  const inputHash = await sha256Hex(
    JSON.stringify({
      workId: work._id,
      testId: work.testId,
      model,
      providerMode,
      promptVersion: REDPEN_ANALYSIS_PROMPT_VERSION,
      schemaVersion: REDPEN_AI_SCHEMA_VERSION,
      inputRefs
    })
  )
  const attemptId = (await ctx.runMutation(aiActionRefs.recordAttemptStarted, {
    teacherId: work.teacherId,
    testId: work.testId,
    workId: work._id,
    provider: providerMode === "mock" ? "mock" : "openai",
    endpoint,
    dataControlMode: providerMode === "mock" ? "synthetic_fixture_only" : "store_false",
    dataResidencyRegion: endpoint === "https://eu.api.openai.com" ? "europe" : undefined,
    model,
    promptVersion: REDPEN_ANALYSIS_PROMPT_VERSION,
    schemaVersion: REDPEN_AI_SCHEMA_VERSION,
    purpose: "full_document_analysis",
    inputHash
  })) as Id<"aiAttempts">

  try {
    if (workUploads.length === 0) {
      throw new Error("No student work uploads are attached to this work")
    }

    const analysis: RedPenAnalysis =
      providerMode === "mock"
        ? RedPenAnalysisSchema.parse(syntheticAnalysisForConvex(test.defaultFeedbackLanguage))
        : await callOpenAIResponses(ctx, {
            endpoint,
            model,
            apiKey: process.env.OPENAI_API_KEY,
            testTitle: test.title,
            feedbackLanguage: test.defaultFeedbackLanguage,
            teacherNotes: test.notes,
            workUploads,
            gradingContextUploads
          })

    await ctx.runMutation(internal.works.applyAnalysisDraft, {
      workId: work._id,
      fullTranscription: analysis.transcription,
      workMap: analysis.workMap,
      studentIdentityDraft: analysis.studentIdentityDraft,
      contextInterpretation: analysis.contextInterpretation,
      overallDraft: analysis.overallDraft,
      reviewFlags: analysis.reviewFlags,
      taskDrafts: analysis.taskDrafts,
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

async function callOpenAIResponses(
  ctx: ActionCtx,
  input: {
    endpoint: string
    model: string
    apiKey: string | undefined
    testTitle: string
    feedbackLanguage: "et" | "en"
    teacherNotes?: string
    workUploads: UploadForAi[]
    gradingContextUploads: UploadForAi[]
  }
): Promise<RedPenAnalysis> {
  if (!input.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Convex backend environment")
  }

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
            : undefined
      })
    }
  ]

  for (const upload of input.gradingContextUploads) {
    await appendUploadContent(ctx, userContent, upload, "Hindamisjuhend / grading guide")
  }

  for (const upload of input.workUploads) {
    await appendUploadContent(ctx, userContent, upload, "Student work")
  }

  const response = await fetch(responsesEndpoint(input.endpoint), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
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
          name: "redpen_analysis",
          strict: true,
          schema: RedPenAnalysisJsonSchema
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

  return RedPenAnalysisSchema.parse(JSON.parse(rawText))
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

function responsesEndpoint(endpoint: string) {
  const normalized = endpoint.replace(/\/+$/, "")
  return normalized.endsWith("/v1") ? `${normalized}/responses` : `${normalized}/v1/responses`
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
