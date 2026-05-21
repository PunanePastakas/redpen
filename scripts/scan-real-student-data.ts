import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { looksLikeRealStudentDataPath } from "@/lib/file-validation"

const roots = ["fixtures", "public", "screenshots", "docs"]
const findings: string[] = []

for (const root of roots) {
  if (!existsSync(root)) continue
  walk(root)
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`[real-student-data-scan] ${finding}`)
  }
  process.exit(1)
}

console.log("No obvious real student data paths found in public fixture/screenshot/doc locations.")

function walk(path: string) {
  const stat = statSync(path)
  if (stat.isDirectory()) {
    for (const child of readdirSync(path)) {
      walk(join(path, child))
    }
    return
  }

  if (looksLikeRealStudentDataPath(path)) {
    findings.push(path)
  }
}
