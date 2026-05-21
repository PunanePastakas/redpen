export type StudentCandidate = {
  id: string
  displayName: string
  normalizedName?: string
}

export type NameSuggestion = {
  studentId: string
  displayName: string
  confidence: number
  evidence: string
}

export function normalizeName(value: string) {
  return value
    .toLocaleLowerCase("et")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function scoreNameMatch(detectedName: string | null | undefined, candidateName: string) {
  if (!detectedName) return 0
  const detected = normalizeName(detectedName)
  const candidate = normalizeName(candidateName)
  if (!detected || !candidate) return 0
  if (detected === candidate) return 1
  if (detected.includes(candidate) || candidate.includes(detected)) return 0.82

  const detectedParts = new Set(detected.split(" "))
  const candidateParts = candidate.split(" ")
  const overlap = candidateParts.filter((part) => detectedParts.has(part)).length
  return Math.min(0.75, overlap / Math.max(candidateParts.length, 1))
}

export function suggestStudentMatches(detectedName: string | null | undefined, candidates: StudentCandidate[]): NameSuggestion[] {
  return candidates
    .map((candidate) => {
      const confidence = scoreNameMatch(detectedName, candidate.normalizedName ?? candidate.displayName)
      return {
        studentId: candidate.id,
        displayName: candidate.displayName,
        confidence,
        evidence: detectedName ? `Detected name "${detectedName}"` : "No detected name"
      }
    })
    .filter((suggestion) => suggestion.confidence > 0.2)
    .sort((left, right) => right.confidence - left.confidence)
}
