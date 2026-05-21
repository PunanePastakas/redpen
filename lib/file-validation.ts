export const acceptedUploadMimeTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"] as const
export type AcceptedUploadMimeType = (typeof acceptedUploadMimeTypes)[number]

export type UploadRole = "student_work" | "grading_context" | "derived_page" | "derived_crop"

export const MAX_STUDENT_WORK_BYTES = 20 * 1024 * 1024
export const MAX_CONTEXT_BYTES = 15 * 1024 * 1024
export const MAX_FILES_PER_TEST = 60

export function isAcceptedMimeType(value: string): value is AcceptedUploadMimeType {
  return acceptedUploadMimeTypes.includes(value as AcceptedUploadMimeType)
}

export function validateUploadFile(input: { filename: string; mimeType: string; size: number; role: UploadRole }) {
  const errors: string[] = []
  if (!isAcceptedMimeType(input.mimeType)) {
    errors.push("Only JPG, PNG, PDF, and text context files are supported.")
  }

  const maxBytes = input.role === "grading_context" ? MAX_CONTEXT_BYTES : MAX_STUDENT_WORK_BYTES
  if (input.size <= 0 || input.size > maxBytes) {
    errors.push(`File size must be between 1 byte and ${Math.floor(maxBytes / 1024 / 1024)} MB.`)
  }

  if (looksLikeRealStudentDataPath(input.filename)) {
    errors.push("Filename looks like real student data. Use synthetic/anonymized fixtures only in the public repo.")
  }

  return { ok: errors.length === 0, errors }
}

export function inferFileKind(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf"
  if (mimeType === "text/plain") return "text"
  if (mimeType.startsWith("image/")) return "image"
  return "unknown"
}

export function looksLikeRealStudentDataPath(path: string) {
  const lowered = path.toLowerCase()
  const redFlags = [
    "isikukood",
    "personal-code",
    "real-student",
    "klassipaevik",
    "ekool-export",
    "stuudium-export",
    "student-real",
    "raw-student"
  ]

  return redFlags.some((flag) => lowered.includes(flag))
}
