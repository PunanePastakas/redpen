import { describe, expect, it } from "vitest"
import { syntheticAzureEnv, syntheticSafeEnv, validateRuntimeConfig } from "@/lib/config"

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

  it("accepts Azure OpenAI when EU deployment metadata is present", () => {
    const result = validateRuntimeConfig(syntheticAzureEnv, { mode: "production" })
    expect(result.ok).toBe(true)
  })

  it("requires an Azure deployment name when Azure provider is selected", () => {
    const result = validateRuntimeConfig(
      { ...syntheticAzureEnv, AZURE_OPENAI_DEPLOYMENT: undefined, AZURE_OPENAI_ANALYSIS_DEPLOYMENT: undefined },
      { mode: "production" }
    )
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("AZURE_OPENAI_DEPLOYMENT")
  })

  it("blocks non-EU Azure OpenAI regions in production", () => {
    const result = validateRuntimeConfig({ ...syntheticAzureEnv, AZURE_OPENAI_REGION: "eastus" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("EU Azure region")
  })

  it("blocks unsupported Azure OpenAI deployment types in production", () => {
    const result = validateRuntimeConfig({ ...syntheticAzureEnv, AZURE_OPENAI_DEPLOYMENT_TYPE: "GlobalStandard" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("AZURE_OPENAI_DEPLOYMENT_TYPE")
  })

  it("requires Azure content logging to be disabled", () => {
    const result = validateRuntimeConfig({ ...syntheticAzureEnv, AZURE_OPENAI_CONTENT_LOGGING_DISABLED: "false" }, { mode: "production" })
    expect(result.ok).toBe(false)
    expect(result.errors.join("\n")).toContain("AZURE_OPENAI_CONTENT_LOGGING_DISABLED")
  })
})
