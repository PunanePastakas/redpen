import { describe, expect, it } from "vitest"
import { syntheticSafeEnv, validateRuntimeConfig } from "@/lib/config"

describe("validateRuntimeConfig", () => {
  it("accepts the synthetic safe MVP environment", () => {
    expect(validateRuntimeConfig(syntheticSafeEnv, { mode: "test" }).ok).toBe(true)
  })

  it("fails closed for non-EU Convex region", () => {
    const result = validateRuntimeConfig({ ...syntheticSafeEnv, CONVEX_DEPLOYMENT_REGION: "us-east-1" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("EU West")
  })

  it("does not require OpenAI secrets in the Next runtime", () => {
    const result = validateRuntimeConfig({ ...syntheticSafeEnv, OPENAI_API_KEY: undefined }, { mode: "production" })
    expect(result.ok).toBe(true)
  })

  it("blocks public OpenAI keys", () => {
    const result = validateRuntimeConfig({ ...syntheticSafeEnv, NEXT_PUBLIC_OPENAI_API_KEY: "sk-public" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("NEXT_PUBLIC_OPENAI_API_KEY")
  })

  it("blocks Azure variables until Phase 3b exists", () => {
    const result = validateRuntimeConfig({ ...syntheticSafeEnv, AZURE_OPENAI_ENDPOINT: "https://example.openai.azure.com" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("Phase 3b")
  })
})
