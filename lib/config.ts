export type RuntimeMode = "development" | "test" | "production"

export type RuntimeConfigInput = Record<string, string | undefined>

export type ConfigCheck = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const EU_CONVEX_REGIONS = new Set([
  "eu-west",
  "eu-west-1",
  "eu-west-1-ireland",
  "ireland",
  "aws-eu-west-1"
])

const EU_AZURE_REGIONS = new Set([
  "sweden-central",
  "swedencentral",
  "france-central",
  "francecentral",
  "germany-west-central",
  "germanywestcentral",
  "westeurope",
  "west-europe",
  "northeurope",
  "north-europe",
  "europe"
])

const AZURE_DEPLOYMENT_TYPES = new Set(["standard", "datazone-standard", "provisioned-managed"])

export function validateRuntimeConfig(
  env: RuntimeConfigInput,
  options: { mode?: RuntimeMode; realStudentPilot?: boolean } = {}
): ConfigCheck {
  const mode = options.mode ?? "development"
  const productionLike = mode === "production" || options.realStudentPilot === true
  const errors: string[] = []
  const warnings: string[] = []

  const convexRegion = env.CONVEX_DEPLOYMENT_REGION
  if (!convexRegion) {
    errors.push("CONVEX_DEPLOYMENT_REGION is required.")
  } else if (!EU_CONVEX_REGIONS.has(convexRegion)) {
    errors.push("CONVEX_DEPLOYMENT_REGION must be EU West/Ireland or a documented EU region.")
  }

  if (env.NEXT_PUBLIC_OPENAI_API_KEY) {
    errors.push("NEXT_PUBLIC_OPENAI_API_KEY must never be set; OpenAI keys belong in Convex backend environment variables.")
  }

  if (env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY) {
    errors.push("NEXT_PUBLIC_AZURE_OPENAI_API_KEY must never be set; Azure OpenAI keys belong in Convex backend environment variables.")
  }

  if (env.OPENAI_API_KEY) {
    warnings.push("OPENAI_API_KEY is not used by the Next app; set it in Convex backend env instead.")
  }

  if (env.AZURE_OPENAI_API_KEY) {
    warnings.push("AZURE_OPENAI_API_KEY is not used by the Next app; set it in Convex backend env instead.")
  }

  const dpiaDecisionPath = env.DPIA_DECISION_PATH ?? env.OPENAI_DPIA_DECISION_PATH
  if (env.REAL_STUDENT_PILOT_MODE === "true" && !dpiaDecisionPath) {
    errors.push("REAL_STUDENT_PILOT_MODE requires DPIA_DECISION_PATH documenting the data-control decision.")
  }

  validateAzureOpenAIConfig(env, errors, warnings, productionLike)

  const rawFileProxyEnabled = env.RAW_FILE_PROXY_ENABLED === "true"
  const frontendRuntimeRegion = env.FRONTEND_RUNTIME_REGION
  if (rawFileProxyEnabled && frontendRuntimeRegion && !EU_CONVEX_REGIONS.has(frontendRuntimeRegion)) {
    errors.push("FRONTEND_RUNTIME_REGION must be EU-based when RAW_FILE_PROXY_ENABLED=true.")
  }

  const retentionDays = numberFromEnv(env.RAW_FILE_RETENTION_DAYS)
  if (retentionDays === null || retentionDays <= 0 || retentionDays > 14) {
    errors.push("RAW_FILE_RETENTION_DAYS must be a positive number no greater than 14 for the MVP default.")
  }

  const deleteAfterShareHours = numberFromEnv(env.DELETE_AFTER_SHARE_HOURS)
  if (deleteAfterShareHours === null || deleteAfterShareHours <= 0 || deleteAfterShareHours > 24) {
    errors.push("DELETE_AFTER_SHARE_HOURS must be a positive number no greater than 24 for the MVP default.")
  }

  const abandonedDraftDays = numberFromEnv(env.ABANDONED_DRAFT_RETENTION_DAYS)
  if (abandonedDraftDays === null || abandonedDraftDays <= 0 || abandonedDraftDays > 30) {
    errors.push("ABANDONED_DRAFT_RETENTION_DAYS must be a positive number no greater than 30 for the MVP default.")
  }

  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    const message = "NEXT_PUBLIC_CONVEX_URL is missing; live Convex calls will not run until it is configured."
    if (productionLike) errors.push(message)
    else warnings.push(message)
  }

  return { ok: errors.length === 0, errors, warnings }
}

function validateAzureOpenAIConfig(env: RuntimeConfigInput, errors: string[], warnings: string[], productionLike: boolean) {
  const provider = env.REDPEN_AI_PROVIDER
  const azureSelected = provider === "azure_openai"
  const azureConfigured = Object.entries(env).some(([key, value]) => key.startsWith("AZURE_OPENAI_") && Boolean(value))

  if (provider && !["openai", "azure_openai", "mock"].includes(provider)) {
    errors.push("REDPEN_AI_PROVIDER must be one of openai, azure_openai, or mock.")
  }

  if (azureConfigured && !azureSelected) {
    warnings.push("Azure OpenAI variables are set but REDPEN_AI_PROVIDER is not azure_openai.")
  }

  if (!azureSelected) return

  if (!env.AZURE_OPENAI_ENDPOINT) errors.push("AZURE_OPENAI_ENDPOINT is required when REDPEN_AI_PROVIDER=azure_openai.")
  if (!env.AZURE_OPENAI_API_KEY) warnings.push("AZURE_OPENAI_API_KEY must be set in Convex backend env when REDPEN_AI_PROVIDER=azure_openai.")
  if (!env.AZURE_OPENAI_DEPLOYMENT && !env.AZURE_OPENAI_ANALYSIS_DEPLOYMENT) {
    errors.push("AZURE_OPENAI_DEPLOYMENT or AZURE_OPENAI_ANALYSIS_DEPLOYMENT is required when REDPEN_AI_PROVIDER=azure_openai.")
  }

  const apiVersion = env.AZURE_OPENAI_API_VERSION
  if (!apiVersion) {
    warnings.push("AZURE_OPENAI_API_VERSION is not set; Convex actions default to 2025-04-01-preview.")
  }

  const region = normalizeRegion(env.AZURE_OPENAI_REGION)
  if (productionLike && !region) {
    errors.push("AZURE_OPENAI_REGION is required for production or real-student Azure OpenAI use.")
  } else if (region && !EU_AZURE_REGIONS.has(region)) {
    errors.push("AZURE_OPENAI_REGION must be an EU Azure region for RedPen.")
  }

  const deploymentType = normalizeRegion(env.AZURE_OPENAI_DEPLOYMENT_TYPE)
  if (productionLike && !deploymentType) {
    errors.push("AZURE_OPENAI_DEPLOYMENT_TYPE is required for production or real-student Azure OpenAI use.")
  } else if (deploymentType && !AZURE_DEPLOYMENT_TYPES.has(deploymentType)) {
    errors.push("AZURE_OPENAI_DEPLOYMENT_TYPE must be Standard, DataZoneStandard, or ProvisionedManaged for RedPen.")
  }

  if (env.AZURE_OPENAI_CONTENT_LOGGING_DISABLED !== "true") {
    errors.push("AZURE_OPENAI_CONTENT_LOGGING_DISABLED must be true when REDPEN_AI_PROVIDER=azure_openai.")
  }
}

function normalizeRegion(value: string | undefined) {
  return value?.toLowerCase().replace(/\s+/g, "").replace(/_/g, "-")
}

export function numberFromEnv(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const syntheticSafeEnv: RuntimeConfigInput = {
  NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
  CONVEX_DEPLOYMENT_REGION: "eu-west-1",
  RAW_FILE_RETENTION_DAYS: "14",
  DELETE_AFTER_SHARE_HOURS: "24",
  ABANDONED_DRAFT_RETENTION_DAYS: "30",
  REAL_STUDENT_PILOT_MODE: "false",
  RAW_FILE_PROXY_ENABLED: "false",
  FRONTEND_RUNTIME_REGION: "eu-west-1"
}

export const syntheticAzureEnv: RuntimeConfigInput = {
  ...syntheticSafeEnv,
  REDPEN_AI_PROVIDER: "azure_openai",
  AZURE_OPENAI_ENDPOINT: "https://redpen-synthetic.openai.azure.com",
  AZURE_OPENAI_API_VERSION: "2025-04-01-preview",
  AZURE_OPENAI_DEPLOYMENT: "gpt-5-5-eu",
  AZURE_OPENAI_REGION: "sweden-central",
  AZURE_OPENAI_DEPLOYMENT_TYPE: "datazone_standard",
  AZURE_OPENAI_CONTENT_LOGGING_DISABLED: "true"
}
