export type MockExportInput = {
  testTitle: string
  studentDisplayName: string
  totalPoints: number | null
  maxPoints: number | null
  grade: string | null
  finalFeedback: string
  confirmedAt: string | null
}

export function buildMockEkoolExport(input: MockExportInput) {
  if (!input.confirmedAt) {
    throw new Error("Mock eKool/Stuudium export is only available after teacher confirmation.")
  }

  return {
    provider: "mock-ekool-stuudium",
    production: false,
    generatedAt: new Date().toISOString(),
    payload: {
      testTitle: input.testTitle,
      studentDisplayName: input.studentDisplayName,
      totalPoints: input.totalPoints,
      maxPoints: input.maxPoints,
      grade: input.grade,
      finalFeedback: input.finalFeedback,
      confirmedAt: input.confirmedAt
    }
  }
}
