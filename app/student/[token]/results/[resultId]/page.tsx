import { StudentResultView } from "@/components/student-result-view"

type StudentResultPageProps = {
  params: Promise<{ token: string; resultId: string }>
}

export default async function StudentResultPage({ params }: StudentResultPageProps) {
  const { token, resultId } = await params
  return <StudentResultView token={token} resultId={resultId} />
}
