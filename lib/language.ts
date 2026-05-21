import type { FeedbackLanguage } from "@/lib/ai-schemas"

export const feedbackLanguageLabels: Record<FeedbackLanguage, string> = {
  et: "Eesti",
  en: "English"
}

export function normalizeFeedbackLanguage(value: string | null | undefined): FeedbackLanguage {
  return value === "en" ? "en" : "et"
}
