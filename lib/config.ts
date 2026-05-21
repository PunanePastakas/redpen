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

const AZURE_PREFIXES = ["AZURE_OPENAI_", "FOUNDRY_"]

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

  if (env.OPENAI_API_KEY) {
    warnings.push("OPENAI_API_KEY is not used by the Next app; set it in Convex backend env instead.")
  }

  const dpiaDecisionPath = env.DPIA_DECISION_PATH ?? env.OPENAI_DPIA_DECISION_PATH
  if (env.REAL_STUDENT_PILOT_MODE === "true" && !dpiaDecisionPath) {
    errors.push("REAL_STUDENT_PILOT_MODE requires DPIA_DECISION_PATH documenting the data-control decision.")
  }

  for (const [key, value] of Object.entries(env)) {
    if (value && AZURE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      errors.push(`${key} is set, but Azure/Foundry provider variables are blocked until Phase 3b is implemented.`)
    }
  }

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
