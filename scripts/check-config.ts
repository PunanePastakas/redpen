import { validateRuntimeConfig } from "@/lib/config"

const result = validateRuntimeConfig(process.env, {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  realStudentPilot: process.env.REAL_STUDENT_PILOT_MODE === "true"
})

for (const warning of result.warnings) {
  console.warn(`[config warning] ${warning}`)
}

if (!result.ok) {
  for (const error of result.errors) {
    console.error(`[config error] ${error}`)
  }
  process.exit(1)
}

console.log("Runtime configuration passed RedPen MVP guardrails.")
