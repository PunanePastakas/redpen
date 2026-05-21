"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Link2,
  Loader2,
  Pencil,
  Play,
  Plus,
  Save,
  Share2,
  Trash2,
  Undo2,
  Upload,
  UserPlus
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import type { AnnotationTarget, FeedbackLanguage } from "@/lib/ai-schemas"
import { AITransparencyMarker } from "@/components/ai-transparency-marker"
import { SignUpSection } from "@/components/auth-panel"
import { DocumentViewer, type PreviewUpload } from "@/components/document-viewer"
import { GlobalNavbar } from "@/components/global-navbar"
import { MathText } from "@/components/math-text"
import { StatusPill } from "@/components/status-pill"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, Textarea, TextInput } from "@/components/ui/field"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { IconButton } from "@/components/ui/icon-button"
import { Modal } from "@/components/ui/modal"
import { Panel } from "@/components/ui/panel"
import { Select } from "@/components/ui/select"
import { sha256FileHex } from "@/lib/browser-hashing"
import { cn } from "@/lib/classnames"
import { inferFileKind, validateUploadFile, type UploadRole } from "@/lib/file-validation"
import { canRemoveWorkFromActiveWorkflow, selectNextWorkIdAfterRemoval } from "@/lib/workflow-state"

const convexAuthEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)

type UploadWithUrl = Doc<"uploadedFiles"> & { url: string | null }
type TaskReview = Doc<"taskReviews">
type WorkStatus = Doc<"studentWorks">["status"]
type ReviewStatus = Doc<"taskReviews">["status"]
type NewTestDraft = {
  title: string
  defaultFeedbackLanguage: FeedbackLanguage
  gradingGuideFile: File | null
}

const runningStatuses: WorkStatus[] = ["transcribing", "mapped", "drafted"]

export function WorkbenchShell() {
  if (!convexAuthEnabled) {
    return <SetupRequiredShell />
  }

  return (
    <main className="min-h-screen">
      <AuthLoading>
        <GlobalNavbar />
        <CenteredState title="Seansi kontrollimine" body="RedPen valmistab töölauda ette." />
      </AuthLoading>
      <Unauthenticated>
        <GlobalNavbar />
        <UnauthenticatedEmptyState />
      </Unauthenticated>
      <Authenticated>
        <LiveWorkbench />
      </Authenticated>
    </main>
  )
}

function UnauthenticatedEmptyState() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-5 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        <div className="flex h-12 w-12 items-center justify-center border border-[var(--rp-ink)] bg-[var(--rp-primary-soft)] text-[var(--rp-primary-strong)] shadow-[var(--rp-shadow-ink-soft)]">
          <FileText aria-hidden="true" size={22} />
        </div>
        <h2 className="font-display mt-5 text-4xl font-semibold leading-tight">Grade math tests with a calmer red pen</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--rp-muted)]">
          Upload student works, get automatic AI assessment, approve and share with students.
        </p>
      </section>
      <SignUpSection />
    </div>
  )
}

function SetupRequiredShell() {
  return (
    <main className="min-h-screen">
      <GlobalNavbar />
      <CenteredState
        title="Convex setup required"
        body="Set NEXT_PUBLIC_CONVEX_URL and run the Convex/Auth setup before using the live workbench. The app no longer fills this state with synthetic students or works."
      />
    </main>
  )
}

function LiveWorkbench() {
  const tests = useQuery(api.tests.list, {}) as Doc<"tests">[] | undefined
  const createTest = useMutation(api.tests.create)
  const updateTest = useMutation(api.tests.update)
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const recordUploadedFile = useMutation(api.uploads.recordUploadedFile)
  const createWork = useMutation(api.works.create)
  const archiveWork = useMutation(api.works.archive)
  const restoreWork = useMutation(api.works.restore)
  const requestAnalysis = useMutation(api.works.requestAnalysis)
  const requestAnalysisBatch = useMutation(api.works.requestAnalysisBatch)
  const updateReview = useMutation(api.reviews.updateDecision)
  const createStudent = useMutation(api.students.create)
  const confirmNameMatch = useMutation(api.works.confirmNameMatch)
  const confirmResult = useMutation(api.results.confirm)
  const shareResult = useMutation(api.results.share)
  const issueInviteToken = useMutation(api.students.issueInviteToken)

  const [selectedTestId, setSelectedTestId] = useState<Id<"tests"> | null>(null)
  const [selectedWorkId, setSelectedWorkId] = useState<Id<"studentWorks"> | null>(null)
  const [selectedTaskReviewId, setSelectedTaskReviewId] = useState<Id<"taskReviews"> | null>(null)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.92)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreateTestModal, setShowCreateTestModal] = useState(false)
  const [showEditTestModal, setShowEditTestModal] = useState(false)
  const [creatingTest, setCreatingTest] = useState(false)
  const [savingTest, setSavingTest] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingWork, setRemovingWork] = useState(false)
  const [removedWorkUndo, setRemovedWorkUndo] = useState<{ workId: Id<"studentWorks">; label: string } | null>(null)
  const [newTest, setNewTest] = useState<NewTestDraft>(emptyNewTestDraft)
  const [studentDraft, setStudentDraft] = useState<{ workId: Id<"studentWorks"> | null; name: string; existingStudentId: Id<"students"> | "" }>({
    workId: null,
    name: "",
    existingStudentId: ""
  })
  const [resultDraft, setResultDraft] = useState<{ workId: Id<"studentWorks"> | null; finalFeedback: string; grade: string; showPoints: boolean; showGrade: boolean }>({
    workId: null,
    finalFeedback: "",
    grade: "",
    showPoints: false,
    showGrade: false
  })
  const [latestResultId, setLatestResultId] = useState<Id<"studentResults"> | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [mockExportCopied, setMockExportCopied] = useState(false)
  const workInputRef = useRef<HTMLInputElement>(null)
  const dismissStatusMessages = useCallback(() => {
    setMessage(null)
    setError(null)
  }, [])

  const activeTestId = useMemo(() => {
    if (!tests?.length) return null
    return tests.find((test) => test._id === selectedTestId)?._id ?? tests[0]!._id
  }, [selectedTestId, tests])
  const selectedTest = tests?.find((test) => test._id === activeTestId) ?? null
  const uploads = useQuery(api.uploads.listByTest, activeTestId ? { testId: activeTestId } : "skip") as UploadWithUrl[] | undefined
  const contextCounts = useQuery(
    api.uploads.countGradingContextByTests,
    tests?.length ? { testIds: tests.map((test) => test._id) } : "skip"
  ) as { testId: Id<"tests">; count: number }[] | undefined
  const works = useQuery(api.works.listByTest, activeTestId ? { testId: activeTestId } : "skip") as Doc<"studentWorks">[] | undefined
  const students = useQuery(api.students.list, {}) as Doc<"students">[] | undefined
  const activeWorkId = useMemo(() => {
    if (!works?.length) return null
    return works.find((work) => work._id === selectedWorkId)?._id ?? works[0]!._id
  }, [selectedWorkId, works])
  const workUploads = useQuery(api.uploads.listByWork, activeWorkId ? { workId: activeWorkId } : "skip") as UploadWithUrl[] | undefined
  const taskReviews = useQuery(api.reviews.listByWork, activeWorkId ? { workId: activeWorkId } : "skip") as TaskReview[] | undefined
  const result = useQuery(api.results.getByWork, activeWorkId ? { workId: activeWorkId } : "skip")
  const activeResultId = result?._id ?? latestResultId
  const mockExport = useQuery(api.results.mockExport, activeResultId ? { resultId: activeResultId } : "skip")
  const activeTaskReviewId = useMemo(() => {
    if (!taskReviews?.length) return null
    return taskReviews.find((review) => review._id === selectedTaskReviewId)?._id ?? taskReviews[0]!._id
  }, [selectedTaskReviewId, taskReviews])

  const selectedWork = works?.find((work) => work._id === activeWorkId) ?? null
  const selectedReview = taskReviews?.find((review) => review._id === activeTaskReviewId) ?? null
  const selectedStudent = selectedWork?.studentId ? students?.find((student) => student._id === selectedWork.studentId) : null
  const contextUploads = useMemo(() => (uploads ?? []).filter((upload) => upload.role === "grading_context"), [uploads])
  const contextCountByTestId = useMemo(() => {
    return new Map((contextCounts ?? []).map((item) => [item.testId, item.count]))
  }, [contextCounts])
  const selectedWorkFiles = useMemo(() => (workUploads ?? []).filter((upload) => upload.role === "student_work"), [workUploads])
  const selectedPreview = selectedWorkFiles[0] ? toPreviewUpload(selectedWorkFiles[0]) : null
  const annotations = useMemo(
    () => ((selectedReview?.annotationScene?.elements ?? []) as AnnotationTarget[]).filter((annotation) => annotation.rejectionReason === null),
    [selectedReview]
  )
  const totalPoints = useMemo(() => (taskReviews ?? []).reduce((sum, review) => sum + (review.pointsConfirmed ?? reviewSuggestedPoints(review) ?? 0), 0), [taskReviews])
  const totalMaxPoints = useMemo(() => sumKnownMaxPoints(taskReviews ?? []), [taskReviews])
  const allReviewed = (taskReviews ?? []).length > 0 && (taskReviews ?? []).every((review) => review.status !== "needs_review")
  const linkedStudentId = selectedWork?.studentId ?? null
  const suggestedFeedback = useMemo(
    () =>
      result?.finalFeedback ??
      (taskReviews ?? [])
        .map((review) => review.feedbackConfirmed ?? review.feedbackDraft)
        .filter(Boolean)
        .join("\n\n"),
    [result, taskReviews]
  )

  const currentStudentName = studentDraft.workId === activeWorkId ? studentDraft.name : selectedWork?.detectedName ?? ""
  const currentExistingStudentId = studentDraft.workId === activeWorkId ? studentDraft.existingStudentId : selectedWork?.studentId ?? ""
  const currentFinalFeedback = resultDraft.workId === activeWorkId ? resultDraft.finalFeedback : suggestedFeedback
  const currentGrade = resultDraft.workId === activeWorkId ? resultDraft.grade : result?.grade ?? ""
  const currentShowPoints = resultDraft.workId === activeWorkId ? resultDraft.showPoints : result?.showPoints ?? false
  const currentShowGrade = resultDraft.workId === activeWorkId ? resultDraft.showGrade : result?.showGrade ?? false
  const hasReviewOutput = Boolean((taskReviews?.length ?? 0) > 0 || result)
  const canRunSelectedAnalysis = Boolean(
    selectedWork &&
      !runningStatuses.includes(selectedWork.status) &&
      selectedWork.status !== "confirmed" &&
      selectedWork.status !== "shared" &&
      selectedWork.status !== "archived"
  )
  const canRunBatchAnalysis = Boolean(
    activeTestId &&
      works?.some(
        (work) =>
          !runningStatuses.includes(work.status) &&
          work.status !== "confirmed" &&
          work.status !== "shared" &&
          work.status !== "archived"
      )
  )

  async function handleCreateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setCreatingTest(true)
    let createdTestId: Id<"tests"> | null = null
    try {
      const guideFile = newTest.gradingGuideFile
      const testId = await createTest({
        title: newTest.title.trim(),
        defaultFeedbackLanguage: newTest.defaultFeedbackLanguage
      })
      createdTestId = testId
      setSelectedTestId(testId)
      if (guideFile) {
        await uploadFile({ file: guideFile, role: "grading_context", testId })
      }
      setNewTest(emptyNewTestDraft())
      setShowCreateTestModal(false)
      setMessage(guideFile ? "Test created and grading guide uploaded." : "Test created.")
    } catch (createError) {
      if (createdTestId) {
        setNewTest(emptyNewTestDraft())
        setShowCreateTestModal(false)
        setError(`Test created, but grading guide upload failed: ${errorMessage(createError)}`)
      } else {
        setError(errorMessage(createError))
      }
    } finally {
      setCreatingTest(false)
    }
  }

  async function handleContextUpload(files: FileList | null) {
    if (!activeTestId || !files?.length) return
    setError(null)
    setMessage(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await uploadFile({ file, role: "grading_context", testId: activeTestId })
      }
      setMessage(`${files.length} context file(s) uploaded.`)
    } catch (uploadError) {
      setError(errorMessage(uploadError))
    } finally {
      setUploading(false)
    }
  }

  async function handleWorkUpload(files: FileList | null) {
    if (!activeTestId || !files?.length) return
    setError(null)
    setMessage(null)
    setRemovedWorkUndo(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const workId = await createWork({ testId: activeTestId })
        await uploadFile({ file, role: "student_work", testId: activeTestId, studentWorkId: workId })
        setSelectedWorkId(workId)
        setLatestResultId(null)
      }
      setMessage(`${files.length} work file(s) uploaded.`)
      if (workInputRef.current) workInputRef.current.value = ""
    } catch (uploadError) {
      setError(errorMessage(uploadError))
    } finally {
      setUploading(false)
    }
  }

  function selectTest(testId: Id<"tests">) {
    setSelectedTestId(testId)
    setSelectedWorkId(null)
    setSelectedTaskReviewId(null)
    setLatestResultId(null)
    setShareLink(null)
    setRemovedWorkUndo(null)
  }

  function selectWork(workId: Id<"studentWorks">) {
    setSelectedWorkId(workId)
    setSelectedTaskReviewId(null)
    setLatestResultId(null)
    setShareLink(null)
  }

  async function updateSelectedTest(changes: { title?: string; defaultFeedbackLanguage?: FeedbackLanguage }, closeAfterSave = false) {
    if (!selectedTest) return
    setError(null)
    setSavingTest(true)
    try {
      await updateTest({ testId: selectedTest._id, ...changes })
      if (closeAfterSave) setShowEditTestModal(false)
      setMessage("Test updated.")
    } catch (updateError) {
      setError(errorMessage(updateError))
    } finally {
      setSavingTest(false)
    }
  }

  async function removeSelectedWork() {
    if (!selectedWork || !works || !canRemoveWorkFromActiveWorkflow(selectedWork.status)) return
    setError(null)
    setMessage(null)
    setRemovingWork(true)
    const nextWorkId = selectNextWorkIdAfterRemoval(works, selectedWork._id)
    const removedIndex = works.findIndex((work) => work._id === selectedWork._id)
    const removedLabel = selectedWork.detectedName || `Töö ${removedIndex + 1}`
    try {
      await archiveWork({ workId: selectedWork._id })
      setSelectedWorkId(nextWorkId)
      setSelectedTaskReviewId(null)
      setLatestResultId(null)
      setShareLink(null)
      setRemovedWorkUndo({ workId: selectedWork._id, label: removedLabel })
      setMessage(`${removedLabel} removed from active workflow.`)
    } catch (removeError) {
      setError(errorMessage(removeError))
    } finally {
      setRemovingWork(false)
    }
  }

  async function undoRemoveWork() {
    if (!removedWorkUndo) return
    setError(null)
    try {
      await restoreWork({ workId: removedWorkUndo.workId })
      setSelectedWorkId(removedWorkUndo.workId)
      setRemovedWorkUndo(null)
      setMessage(`${removedWorkUndo.label} restored.`)
    } catch (restoreError) {
      setError(errorMessage(restoreError))
    }
  }

  async function uploadFile(input: { file: File; role: UploadRole; testId: Id<"tests">; studentWorkId?: Id<"studentWorks"> }) {
    const mimeType = input.file.type || "application/octet-stream"
    const validation = validateUploadFile({ filename: input.file.name, mimeType, size: input.file.size, role: input.role })
    if (!validation.ok) throw new Error(validation.errors.join(" "))

    const [postUrl, sha256] = await Promise.all([generateUploadUrl(), sha256FileHex(input.file)])
    const response = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: input.file
    })
    if (!response.ok) throw new Error(`Upload failed for ${input.file.name}`)
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> }
    await recordUploadedFile({
      testId: input.testId,
      studentWorkId: input.studentWorkId,
      storageId,
      role: input.role,
      filename: input.file.name,
      fileKind: inferFileKind(mimeType),
      mimeType,
      size: input.file.size,
      sha256
    })
  }

  async function runAnalysis() {
    if (!activeWorkId) return
    setError(null)
    setMessage("Analysis queued.")
    try {
      await requestAnalysis({ workId: activeWorkId })
    } catch (analysisError) {
      setError(errorMessage(analysisError))
    }
  }

  async function runBatchAnalysis() {
    if (!activeTestId) return
    setError(null)
    setMessage("Analysis queued for available works. Each result appears as soon as it finishes.")
    try {
      const result = await requestAnalysisBatch({ testId: activeTestId })
      setMessage(`${result.queued} work(s) queued independently. You can start reviewing a work as soon as its draft appears.`)
    } catch (analysisError) {
      setError(errorMessage(analysisError))
    }
  }

  async function updateSelectedReview(changes: {
    status: ReviewStatus
    feedbackConfirmed?: string
    pointsConfirmed?: number
  }) {
    if (!selectedReview) return
    setError(null)
    try {
      await updateReview({ taskReviewId: selectedReview._id, ...changes })
    } catch (reviewError) {
      setError(errorMessage(reviewError))
    }
  }

  async function linkStudent() {
    if (!activeWorkId || !selectedTest) return
    setError(null)
    try {
      const studentId =
        currentExistingStudentId ||
        (await createStudent({
          displayName: currentStudentName.trim() || selectedWork?.detectedName || "Unnamed student",
          preferredLanguage: selectedTest.defaultFeedbackLanguage,
          externalRef: undefined
        }))
      await confirmNameMatch({
        workId: activeWorkId,
        studentId,
        detectedName: currentStudentName.trim() || selectedWork?.detectedName || undefined,
        matchConfidence: selectedWork?.matchConfidence
      })
      setStudentDraft({ workId: activeWorkId, name: currentStudentName, existingStudentId: studentId })
      setMessage("Student linked.")
    } catch (studentError) {
      setError(errorMessage(studentError))
    }
  }

  async function confirmSelectedResult() {
    if (!activeWorkId || !linkedStudentId || !selectedTest) return
    setError(null)
    try {
      const resultId = await confirmResult({
        workId: activeWorkId,
        studentId: linkedStudentId,
        finalFeedback: currentFinalFeedback.trim(),
        feedbackLanguage: selectedTest.defaultFeedbackLanguage,
        totalPoints,
        maxPoints: totalMaxPoints ?? selectedTest.maxPoints,
        grade: currentGrade.trim() || undefined,
        showPoints: currentShowPoints,
        showGrade: currentShowGrade,
        annotationScene: combinedAnnotationScene(taskReviews ?? [])
      })
      setLatestResultId(resultId)
      setMessage("Result confirmed.")
    } catch (confirmError) {
      setError(errorMessage(confirmError))
    }
  }

  async function shareSelectedResult() {
    const resultId = result?._id ?? latestResultId
    if (!resultId || !linkedStudentId) return
    setError(null)
    try {
      const { token } = await issueInviteToken({
        studentId: linkedStudentId,
        expiresAt: oneYearFromNow()
      })
      await shareResult({ resultId })
      const link = `/student/${token}/results/${resultId}`
      setShareLink(link)
      setMessage("Result shared.")
    } catch (shareError) {
      setError(errorMessage(shareError))
    }
  }

  function copyMockExport() {
    if (!mockExport) return
    void navigator.clipboard?.writeText(JSON.stringify(mockExport, null, 2))
    setMockExportCopied(true)
    window.setTimeout(() => setMockExportCopied(false), 1600)
  }

  if (!tests) {
    return (
      <>
        <GlobalNavbar shareLink={shareLink} />
        <CenteredState title="Laen töölauda" body="Küsin sinu teste Convexist." />
      </>
    )
  }

  return (
    <>
      <GlobalNavbar shareLink={shareLink} />
      <CreateTestModal
        open={showCreateTestModal}
        newTest={newTest}
        onChange={setNewTest}
        onSubmit={handleCreateTest}
        onClose={() => setShowCreateTestModal(false)}
        pending={creatingTest}
      />
      <EditTestModal
        open={showEditTestModal}
        test={selectedTest}
        contextUploads={contextUploads}
        onSave={(changes) => void updateSelectedTest(changes, true)}
        onUploadGuide={(files) => void handleContextUpload(files)}
        onClose={() => setShowEditTestModal(false)}
        pending={savingTest}
        uploading={uploading}
      />
      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)_430px]">
        <aside className="space-y-4">
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Kontrolltööd</h2>
              <IconButton title="Create test" aria-label="Create test" onClick={() => setShowCreateTestModal(true)} variant="primary">
                <Plus size={17} />
              </IconButton>
            </div>
            {tests.length > 0 ? (
              <div className="mt-3 space-y-2">
                {tests.map((test) => (
                  <div
                    key={test._id}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-[var(--rp-radius-control)] border p-2 text-sm transition",
                      activeTestId === test._id
                        ? "border-[var(--rp-ink)] bg-[var(--rp-primary-wash)] shadow-[var(--rp-shadow-ink-soft)]"
                        : "border-[var(--rp-border)] bg-[var(--rp-surface)] hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]"
                    )}
                  >
                    <button className="min-w-0 flex-1 text-left" onClick={() => selectTest(test._id)}>
                      <span className="block truncate font-semibold">{test.title}</span>
                      <span className="mt-1 block text-xs text-[var(--rp-muted)]">
                        {test.defaultFeedbackLanguage === "et" ? "Eesti tagasiside" : "English feedback"} · {contextCountByTestId.get(test._id) ?? 0} juhendit
                      </span>
                    </button>
                    <IconButton
                      title="Muuda testi seadeid"
                      aria-label={`Muuda testi ${test.title} seadeid`}
                      onClick={() => {
                        selectTest(test._id)
                        setShowEditTestModal(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                action={(
                  <Button className="w-full" onClick={() => setShowCreateTestModal(true)} variant="primary">
                    <Plus size={16} />
                    Loo test
                  </Button>
                )}
                body="Loo esimene test, et lisada hindamisjuhend ja õpilaste tööd."
                className="mt-3 min-h-0 p-4"
                title="Kontrolltöid pole veel"
              />
            )}
          </Panel>
        </aside>

        <div className="min-w-0 space-y-4">
          <StatusMessages
            message={message}
            error={error}
            onDismiss={dismissStatusMessages}
          />
          {!activeTestId ? (
            <Panel>
              <EmptyState
                body="Tööde üleslaadimine avaneb pärast testi loomist."
                className="border-0 bg-transparent"
                icon={<Upload aria-hidden="true" size={36} />}
                title="Vali või loo test"
              />
            </Panel>
          ) : !works ? (
            <Panel>
              <EmptyState
                body="Küsin valitud testi töid Convexist."
                className="border-0 bg-transparent"
                icon={<Loader2 aria-hidden="true" className="animate-spin" size={34} />}
                title="Laen töid"
              />
            </Panel>
          ) : works.length === 0 ? (
            <FileDropzone
              accept="image/jpeg,image/png,application/pdf"
              body="Laadi üles JPG, PNG või PDF. Pärast üleslaadimist ilmub siia kohe eelvaade."
              buttonLabel="Laadi tööd üles"
              loading={uploading}
              multiple
              onFiles={(files) => void handleWorkUpload(files)}
              title="Lisa esimene töö"
            />
          ) : (
            <>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">Töö eelvaade</h2>
                    <p className="mt-1 truncate text-sm text-[var(--rp-muted)]">{selectedWorkFiles[0]?.filename ?? "Faili eelvaade avaneb pärast üleslaadimist."}</p>
                  </div>
                  {selectedWork ? <StatusPill status={selectedWork.status} /> : null}
                </div>
                {works && works.length > 0 ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {works.map((work, index) => (
                      <button
                        key={work._id}
                        className={cn(
                          "shrink-0 rounded-[var(--rp-radius-control)] border px-3 py-2 text-left text-sm transition",
                          activeWorkId === work._id
                            ? "border-[var(--rp-ink)] bg-[var(--rp-primary-wash)] shadow-[var(--rp-shadow-ink-soft)]"
                            : "border-[var(--rp-border)] bg-[var(--rp-surface)] hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]"
                        )}
                        onClick={() => selectWork(work._id)}
                      >
                        <span className="block max-w-36 truncate font-semibold">{work.detectedName || `Töö ${index + 1}`}</span>
                        <span className="mt-1 block text-xs text-[var(--rp-muted)]">{work.status.replace("_", " ")}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <input
                  ref={workInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  multiple
                  onChange={(event) => void handleWorkUpload(event.target.files)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={uploading}
                    onClick={() => workInputRef.current?.click()}
                    variant="secondary"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    Lisa töid
                  </Button>
                  <Button
                    disabled={!selectedWork || !canRemoveWorkFromActiveWorkflow(selectedWork.status) || removingWork}
                    title={selectedWork && !canRemoveWorkFromActiveWorkflow(selectedWork.status) ? "Seda tööd ei saa praegu aktiivsest töövoost eemaldada" : "Eemalda töö aktiivsest töövoost"}
                    onClick={() => void removeSelectedWork()}
                    variant="danger"
                  >
                    {removingWork ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Eemalda
                  </Button>
                  {removedWorkUndo ? (
                    <Button onClick={() => void undoRemoveWork()} variant="secondary">
                      <Undo2 size={16} />
                      Taasta {removedWorkUndo.label}
                    </Button>
                  ) : null}
                </div>
              </Panel>
              <DocumentViewer
                file={selectedPreview}
                annotations={annotations}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
                zoom={zoom}
                onZoomChange={setZoom}
              />
            </>
          )}
        </div>

        <aside className="space-y-4">
          <Panel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Analysis</h2>
                <p className="mt-1 text-sm text-[var(--rp-muted)]">
                  {!selectedWork
                    ? "Select or upload a work first."
                    : selectedWork.status === "error"
                      ? selectedWork.error || "Analysis failed. You can retry."
                      : selectedWork.status === "confirmed" || selectedWork.status === "shared"
                        ? "This result is already confirmed."
                      : runningStatuses.includes(selectedWork.status)
                        ? "Analysis is running."
                        : "Run analysis for the selected work."}
                </p>
              </div>
              {selectedWork && runningStatuses.includes(selectedWork.status) ? <Loader2 className="mt-1 animate-spin text-[var(--rp-primary)]" aria-hidden="true" size={18} /> : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                className="w-full"
                disabled={!canRunBatchAnalysis}
                onClick={() => void runBatchAnalysis()}
                variant="primary"
              >
                <Play size={16} />
                Run all
              </Button>
              <Button
                className="w-full"
                disabled={!canRunSelectedAnalysis}
                onClick={() => void runAnalysis()}
                variant="secondary"
              >
                {selectedWork && runningStatuses.includes(selectedWork.status) ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                {selectedWork?.status === "error" ? "Retry selected" : "Run selected"}
              </Button>
            </div>
          </Panel>

          {hasReviewOutput ? (
            <Panel>
              <h2 className="font-semibold">Student link</h2>
              {selectedStudent ? (
                <p className="mt-2 text-sm text-[var(--rp-muted)]">Linked to {selectedStudent.displayName}</p>
              ) : (
                <p className="mt-2 text-sm text-[var(--rp-muted)]">Link or create a student before confirmation and sharing.</p>
              )}
              {students?.length ? (
                <Select
                  className="mt-3"
                  value={currentExistingStudentId}
                  disabled={!selectedWork}
                  onChange={(event) => setStudentDraft({ workId: activeWorkId, name: currentStudentName, existingStudentId: event.target.value as Id<"students"> | "" })}
                >
                  <option value="">Create from name below</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>{student.displayName}</option>
                  ))}
                </Select>
              ) : null}
              <TextInput
                className="mt-3"
                placeholder="Student name"
                value={currentStudentName}
                disabled={!selectedWork}
                onChange={(event) => setStudentDraft({ workId: activeWorkId, name: event.target.value, existingStudentId: currentExistingStudentId })}
              />
              <Button
                className="mt-3 w-full"
                disabled={!selectedWork}
                onClick={() => void linkStudent()}
                variant="secondary"
              >
                <UserPlus size={16} />
                Link student
              </Button>
            </Panel>
          ) : null}

          {taskReviews?.length ? (
            <Panel>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Review queue</h2>
                  <p className="mt-1 text-sm text-[var(--rp-muted)]">Accept, edit, reject, or replace every draft.</p>
                </div>
                <AITransparencyMarker variant="badge" />
              </div>
              <div className="mt-3 space-y-2">
                {taskReviews.map((review) => (
                  <button
                    key={review._id}
                    className={cn(
                      "w-full rounded-[var(--rp-radius-control)] border px-3 py-2 text-left text-sm transition",
                      activeTaskReviewId === review._id
                        ? "border-[var(--rp-ink)] bg-[var(--rp-primary-wash)] shadow-[var(--rp-shadow-ink-soft)]"
                        : "border-[var(--rp-border)] bg-[var(--rp-surface)] hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]"
                    )}
                    onClick={() => setSelectedTaskReviewId(review._id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{review.stableKey}</span>
                      <span className="text-xs text-[var(--rp-muted)]">{review.status.replace("_", " ")}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--rp-muted)]">
                        Suggested {pointsOutOfMaxLabel(reviewSuggestedPoints(review), reviewMaxPoints(review))} pts
                      </span>
                      <ScoreBandBadge band={reviewScoreBand(review)} />
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          ) : null}

          {selectedReview ? (
            <Panel>
              <h2 className="font-semibold">{selectedReview.stableKey}</h2>
              <div className="mt-4">
                <AITransparencyMarker variant="inline" contentType="tagasiside" />
              </div>
              <ReviewScoreSummary review={selectedReview} />
              <GradingTaskPreview review={selectedReview} />
              <Field className="mt-4" htmlFor="feedback-draft" label="Final feedback">
                <Textarea
                  key={selectedReview._id}
                  id="feedback-draft"
                  defaultValue={selectedReview.feedbackConfirmed ?? selectedReview.feedbackDraft}
                  onBlur={(event) => void updateSelectedReview({ status: "edited", feedbackConfirmed: event.target.value })}
                />
              </Field>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Points <span className="font-normal text-[var(--rp-muted)]">/ {formatPoints(reviewMaxPoints(selectedReview))}</span>
                  <TextInput
                    key={`${selectedReview._id}-points`}
                    className="mt-2"
                    type="number"
                    min={0}
                    max={reviewMaxPoints(selectedReview) ?? undefined}
                    defaultValue={selectedReview.pointsConfirmed ?? ""}
                    onBlur={(event) =>
                      void updateSelectedReview({
                        status: "edited",
                        pointsConfirmed: event.target.value === "" ? 0 : Number(event.target.value)
                      })
                    }
                  />
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <Select
                    className="mt-2"
                    value={selectedReview.status}
                    onChange={(event) => void updateSelectedReview({ status: event.target.value as ReviewStatus })}
                  >
                    <option value="needs_review">Needs review</option>
                    <option value="accepted">Accepted</option>
                    <option value="edited">Edited</option>
                    <option value="rejected">Rejected</option>
                    <option value="manual">Manual</option>
                    <option value="confirmed">Confirmed</option>
                  </Select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void updateSelectedReview({ status: "accepted" })} variant="primary">
                  <Check size={16} />
                  Accept
                </Button>
                <Button onClick={() => void updateSelectedReview({ status: "manual", feedbackConfirmed: "" })} variant="secondary">
                  <Pencil size={16} />
                  Replace
                </Button>
              </div>
            </Panel>
          ) : null}

          {hasReviewOutput ? (
              <Panel>
                <h2 className="font-semibold">Final result</h2>
                <p className="mt-2 text-sm text-[var(--rp-muted)]">Total: {formatPoints(totalPoints)} / {formatPoints(totalMaxPoints ?? selectedTest?.maxPoints)}</p>
                <FullTranscriptDisclosure transcription={selectedWork?.fullTranscription} />
                <Textarea
                  className="mt-3 min-h-24"
                  placeholder="Final feedback"
                  value={currentFinalFeedback}
                  disabled={!selectedWork}
                  onChange={(event) =>
                    setResultDraft({
                      workId: activeWorkId,
                      finalFeedback: event.target.value,
                      grade: currentGrade,
                      showPoints: currentShowPoints,
                      showGrade: currentShowGrade
                    })
                  }
                />
                <TextInput
                  className="mt-3"
                  placeholder="Optional grade"
                  value={currentGrade}
                  disabled={!selectedWork}
                  onChange={(event) =>
                    setResultDraft({
                      workId: activeWorkId,
                      finalFeedback: currentFinalFeedback,
                      grade: event.target.value,
                      showPoints: currentShowPoints,
                      showGrade: currentShowGrade
                    })
                  }
                />
                <div className="mt-3 space-y-2">
                  <label className="flex items-center justify-between gap-3 rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-sm">
                    Show points to student
                    <input
                      type="checkbox"
                      checked={currentShowPoints}
                      disabled={!selectedWork}
                      onChange={(event) =>
                        setResultDraft({
                          workId: activeWorkId,
                          finalFeedback: currentFinalFeedback,
                          grade: currentGrade,
                          showPoints: event.target.checked,
                          showGrade: currentShowGrade
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-sm">
                    Show grade to student
                    <input
                      type="checkbox"
                      checked={currentShowGrade}
                      disabled={!selectedWork}
                      onChange={(event) =>
                        setResultDraft({
                          workId: activeWorkId,
                          finalFeedback: currentFinalFeedback,
                          grade: currentGrade,
                          showPoints: currentShowPoints,
                          showGrade: event.target.checked
                        })
                      }
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    className="w-full"
                    onClick={() => void confirmSelectedResult()}
                    disabled={!selectedWork || !linkedStudentId || !allReviewed || !currentFinalFeedback.trim()}
                    title={!linkedStudentId ? "Link a student before confirmation" : allReviewed ? "Confirm result" : "Review every task before confirmation"}
                    variant="primary"
                  >
                    <Save size={16} />
                    Confirm
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => void shareSelectedResult()}
                    disabled={!activeResultId || !linkedStudentId}
                    variant="secondary"
                  >
                    <Share2 size={16} />
                    Share
                  </Button>
                  <Button
                    className="w-full"
                    onClick={copyMockExport}
                    disabled={!mockExport}
                    variant="secondary"
                  >
                    <Copy size={16} />
                    {mockExportCopied ? "Copied" : "Mock export"}
                  </Button>
                  {shareLink ? (
                    <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-sm font-semibold hover:border-[var(--rp-ink)] hover:bg-[var(--rp-surface-warm)]" href={shareLink}>
                      <Link2 size={16} />
                      Open link
                    </a>
                  ) : null}
                </div>
              </Panel>
          ) : null}
        </aside>
      </div>
    </>
  )
}

function CreateTestPanel({
  newTest,
  onChange,
  onSubmit,
  pending,
  compact = false
}: {
  newTest: NewTestDraft
  onChange: (value: NewTestDraft) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  compact?: boolean
}) {
  return (
    <section className={compact ? "" : "rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface)] p-5 shadow-[var(--rp-shadow-ink-soft)]"}>
      {!compact ? <h2 className="text-xl font-semibold">Create your first test</h2> : null}
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <Field label="Title">
          <TextInput
            placeholder="Algebra kontrolltöö"
            required
            value={newTest.title}
            onChange={(event) => onChange({ ...newTest, title: event.target.value })}
          />
        </Field>
        <Field label="Feedback language">
          <Select
            value={newTest.defaultFeedbackLanguage}
            onChange={(event) => onChange({ ...newTest, defaultFeedbackLanguage: event.target.value as FeedbackLanguage })}
          >
            <option value="et">Eesti</option>
            <option value="en">English</option>
          </Select>
        </Field>
        <Field label={<>Hindamisjuhend / Grading guide <span className="font-normal text-[var(--rp-muted)]">(optional)</span></>}>
          <TextInput
            key={newTest.gradingGuideFile ? "guide-selected" : "guide-empty"}
            className="file:mr-3 file:rounded-[var(--rp-radius-control)] file:border-0 file:bg-[var(--rp-primary-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--rp-primary-strong)] hover:file:bg-[var(--rp-primary-wash)]"
            type="file"
            accept="image/jpeg,image/png,application/pdf,text/plain"
            onChange={(event) => onChange({ ...newTest, gradingGuideFile: event.target.files?.[0] ?? null })}
          />
        </Field>
        {newTest.gradingGuideFile ? (
          <p className="text-xs leading-5 text-[var(--rp-muted)]">
            {newTest.gradingGuideFile.name} will be uploaded as grading context for LLM analysis.
          </p>
        ) : null}
        <Button disabled={pending || !newTest.title.trim()} loading={pending} type="submit" variant="primary">
          {!pending ? <Plus size={16} /> : null}
          Create test
        </Button>
      </form>
    </section>
  )
}

function CreateTestModal({
  open,
  newTest,
  onChange,
  onSubmit,
  onClose,
  pending
}: {
  open: boolean
  newTest: NewTestDraft
  onChange: (value: NewTestDraft) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
  pending: boolean
}) {
  return (
    <Modal
      description="Start with the core setup. You can refine title, language, and guide later in the test rail."
      onClose={onClose}
      open={open}
      pending={pending}
      title="Create a new test"
    >
      <CreateTestPanel compact newTest={newTest} onChange={onChange} onSubmit={onSubmit} pending={pending} />
    </Modal>
  )
}

function EditTestModal({
  open,
  test,
  contextUploads,
  onSave,
  onUploadGuide,
  onClose,
  pending,
  uploading
}: {
  open: boolean
  test: Doc<"tests"> | null
  contextUploads: UploadWithUrl[]
  onSave: (changes: { title: string; defaultFeedbackLanguage: FeedbackLanguage }) => void
  onUploadGuide: (files: FileList | null) => void
  onClose: () => void
  pending: boolean
  uploading: boolean
}) {
  if (!open || !test) return null

  return (
    <EditTestDialog
      key={test._id}
      test={test}
      contextUploads={contextUploads}
      onSave={onSave}
      onUploadGuide={onUploadGuide}
      onClose={onClose}
      pending={pending}
      uploading={uploading}
    />
  )
}

function EditTestDialog({
  test,
  contextUploads,
  onSave,
  onUploadGuide,
  onClose,
  pending,
  uploading
}: {
  test: Doc<"tests">
  contextUploads: UploadWithUrl[]
  onSave: (changes: { title: string; defaultFeedbackLanguage: FeedbackLanguage }) => void
  onUploadGuide: (files: FileList | null) => void
  onClose: () => void
  pending: boolean
  uploading: boolean
}) {
  const guideInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(test.title)
  const [defaultFeedbackLanguage, setDefaultFeedbackLanguage] = useState<FeedbackLanguage>(test.defaultFeedbackLanguage)

  return (
    <Modal
      description="Pealkiri, tagasiside keel ja hindamisjuhend kuuluvad valitud testi juurde."
      onClose={onClose}
      open
      pending={pending || uploading}
      title="Muuda testi seadeid"
    >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const nextTitle = title.trim()
            if (!nextTitle) return
            onSave({ title: nextTitle, defaultFeedbackLanguage })
          }}
        >
          <Field label="Pealkiri">
            <TextInput
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="Tagasiside keel">
            <Select
              value={defaultFeedbackLanguage}
              onChange={(event) => setDefaultFeedbackLanguage(event.target.value as FeedbackLanguage)}
            >
              <option value="et">Eesti</option>
              <option value="en">English</option>
            </Select>
          </Field>
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Hindamisjuhend</p>
              <Button
                type="button"
                disabled={uploading}
                onClick={() => guideInputRef.current?.click()}
                variant="secondary"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Lisa
              </Button>
            </div>
            {contextUploads.length > 0 ? (
              <div className="mt-2 space-y-1">
                {contextUploads.map((upload) => (
                  <p key={upload._id} className="truncate rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] px-2 py-1.5 text-xs text-[var(--rp-muted)]">
                    {upload.filename}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[var(--rp-muted)]">Juhendit pole veel lisatud.</p>
            )}
            <input
              ref={guideInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,application/pdf,text/plain"
              multiple
              onChange={(event) => {
                onUploadGuide(event.target.files)
                event.currentTarget.value = ""
              }}
            />
          </div>
          <Button
            disabled={pending || !title.trim()}
            loading={pending}
            type="submit"
            variant="primary"
          >
            {!pending ? <Save size={16} /> : null}
            Salvesta
          </Button>
        </form>
    </Modal>
  )
}

function emptyNewTestDraft(): NewTestDraft {
  return {
    title: "",
    defaultFeedbackLanguage: "et",
    gradingGuideFile: null
  }
}

function CenteredState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center border border-[var(--rp-ink)] bg-[var(--rp-surface)] text-[var(--rp-primary)] shadow-[var(--rp-shadow-ink-soft)]">
        <FileText aria-hidden="true" size={22} />
      </div>
      <h2 className="font-display mt-5 text-3xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--rp-muted)]">{body}</p>
    </div>
  )
}

function StatusMessages({
  message,
  error,
  onDismiss
}: {
  message: string | null
  error: string | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!message && !error) return
    const timeout = window.setTimeout(onDismiss, 4600)
    return () => window.clearTimeout(timeout)
  }, [error, message, onDismiss])

  if (!message && !error) return null
  const toastKey = `${message ?? ""}:${error ?? ""}`

  return (
    <div key={toastKey} className="redpen-toast-stack" aria-live="polite" aria-atomic="true">
      {message ? (
        <div className="redpen-toast rounded-[var(--rp-radius-control)] border border-[var(--rp-success)] bg-[var(--rp-success-soft)] px-3 py-2 text-sm font-medium text-[var(--rp-success)] shadow-[var(--rp-shadow-ink-soft)]">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="redpen-toast flex items-start gap-2 rounded-[var(--rp-radius-control)] border border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] px-3 py-2 text-sm font-medium text-[var(--rp-correction)] shadow-[var(--rp-shadow-ink-soft)]">
          <AlertTriangle aria-hidden="true" size={16} />
          {error}
        </div>
      ) : null}
    </div>
  )
}

type TaskScoreBand = "full_points" | "minor_mistakes" | "major_mistakes" | "not_attempted" | "unclear"

type TaskReviewDraft = {
  taskTranscript?: string
  transcriptExcerpt?: string
  gradingRationale?: string
  teacherReviewFlags?: string[]
  scoreBand?: TaskScoreBand
  suggestedPoints?: {
    value?: number | null
    max?: number | null
  }
  rubric?: {
    maxPoints?: number | null
    source?: string
  }
}

function ReviewScoreSummary({ review }: { review: TaskReview }) {
  const suggested = reviewSuggestedPoints(review)
  const max = reviewMaxPoints(review)
  const confirmed = review.pointsConfirmed
  const band = reviewScoreBand(review)

  return (
    <div className="mt-4 rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScoreBandBadge band={band} large />
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--rp-muted)]">AI suggests</p>
          <p className="text-2xl font-semibold text-[var(--rp-text)]">{pointsOutOfMaxLabel(suggested, max)}</p>
          {confirmed !== undefined && confirmed !== suggested ? (
            <p className="text-xs text-[var(--rp-muted)]">Teacher set {pointsOutOfMaxLabel(confirmed, max)}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function GradingTaskPreview({ review }: { review: TaskReview }) {
  const draft = taskReviewDraft(review)
  const taskTranscript = draft?.taskTranscript ?? draft?.transcriptExcerpt
  if (!taskTranscript && !draft?.gradingRationale && !draft?.teacherReviewFlags?.length) return null

  return (
    <div className="mt-4 space-y-3 rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] p-3 text-sm leading-6">
      {taskTranscript ? (
        <div>
          <p className="font-semibold text-[var(--rp-muted-strong)]">Task transcript</p>
          <div className="mt-1">
            <MathText text={taskTranscript} />
          </div>
        </div>
      ) : null}
      {draft.gradingRationale ? (
        <div>
          <p className="font-semibold text-[var(--rp-muted-strong)]">Grading rationale</p>
          <div className="mt-1">
            <MathText text={draft.gradingRationale} />
          </div>
        </div>
      ) : null}
      {draft.teacherReviewFlags?.length ? (
        <div>
          <p className="font-semibold text-[var(--rp-muted-strong)]">Review flags</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {draft.teacherReviewFlags.map((flag) => (
              <li key={flag}>
                <MathText text={flag} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function FullTranscriptDisclosure({ transcription }: { transcription: unknown }) {
  const sections = transcriptSections(transcription)
  if (sections.length === 0) return null

  return (
    <details className="mt-4 rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface)]">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-[var(--rp-text)]">
        Full student transcript
      </summary>
      <div className="border-t border-[var(--rp-border)] p-3">
        <div className="max-h-72 space-y-4 overflow-auto pr-1 text-sm leading-6">
          {sections.map((section) => (
            <section key={section.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-[var(--rp-muted)]">{section.label}</p>
              <div className="whitespace-pre-wrap rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] px-2 py-1">
                <MathText text={section.text} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </details>
  )
}

function ScoreBandBadge({ band, large = false }: { band: TaskScoreBand | null; large?: boolean }) {
  if (!band) return null

  const tone = scoreBandTone(band)
  const sizeClass = large ? "px-3 py-2 text-base sm:text-lg" : "px-2 py-1 text-xs"

  return (
    <span className={`inline-flex items-center rounded-[var(--rp-radius-control)] border font-semibold ${sizeClass} ${tone.className}`}>
      {tone.label}
    </span>
  )
}

function taskReviewDraft(review: TaskReview): TaskReviewDraft {
  return isRecord(review.transcription) ? review.transcription as TaskReviewDraft : {}
}

function reviewSuggestedPoints(review: TaskReview) {
  return review.pointsSuggested ?? taskReviewDraft(review).suggestedPoints?.value ?? null
}

function reviewMaxPoints(review: TaskReview) {
  const draft = taskReviewDraft(review)
  return draft.suggestedPoints?.max ?? draft.rubric?.maxPoints ?? null
}

function reviewScoreBand(review: TaskReview): TaskScoreBand | null {
  const band = taskReviewDraft(review).scoreBand
  return band && ["full_points", "minor_mistakes", "major_mistakes", "not_attempted", "unclear"].includes(band) ? band : null
}

function sumKnownMaxPoints(reviews: TaskReview[]) {
  if (reviews.length === 0) return null
  const values = reviews.map(reviewMaxPoints)
  return values.every((value): value is number => typeof value === "number")
    ? values.reduce((sum, value) => sum + value, 0)
    : null
}

function pointsOutOfMaxLabel(value: number | null | undefined, max: number | null | undefined) {
  return `${formatPoints(value)} / ${formatPoints(max)}`
}

function formatPoints(value: number | null | undefined) {
  return typeof value === "number" ? `${value}` : "-"
}

function scoreBandTone(band: TaskScoreBand) {
  switch (band) {
    case "full_points":
      return { label: "Full points", className: "border-[var(--rp-success)] bg-[var(--rp-success-soft)] text-[var(--rp-success)]" }
    case "minor_mistakes":
      return { label: "Minor mistakes", className: "border-[var(--rp-brass)] bg-[var(--rp-brass-soft)] text-[var(--rp-brass-strong)]" }
    case "major_mistakes":
      return { label: "Major mistakes", className: "border-[var(--rp-correction)] bg-[var(--rp-correction-wash)] text-[var(--rp-correction)]" }
    case "not_attempted":
      return { label: "Not attempted", className: "border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] text-[var(--rp-muted-strong)]" }
    case "unclear":
      return { label: "Unclear", className: "border-[var(--rp-brass)] bg-[var(--rp-brass-soft)] text-[var(--rp-text)]" }
  }
}

function transcriptSections(transcription: unknown) {
  if (!isRecord(transcription)) return []

  if (Array.isArray(transcription.tasks)) {
    const taskSections = transcription.tasks.flatMap((task, index) => {
      if (!isRecord(task) || typeof task.text !== "string") return []
      const text = task.text.trim()
      if (!text) return []

      const label = typeof task.label === "string" && task.label.trim() ? task.label.trim() : `Task ${index + 1}`
      const key = typeof task.stableKey === "string" && task.stableKey ? task.stableKey : `task-${index + 1}`
      return [{ key, label, text }]
    })

    if (typeof transcription.unassignedText === "string" && transcription.unassignedText.trim()) {
      taskSections.push({
        key: "unassigned",
        label: "Unassigned transcript",
        text: transcription.unassignedText.trim()
      })
    }

    return taskSections
  }

  if (!Array.isArray(transcription.pages)) return []

  return transcription.pages.flatMap((page, index) => {
    if (!isRecord(page) || !Array.isArray(page.lines)) return []
    const lines = page.lines.flatMap((line) => {
      if (!isRecord(line) || typeof line.rawText !== "string") return []
      const trimmed = line.rawText.trim()
      return trimmed ? [trimmed] : []
    })
    if (lines.length === 0) return []

    const pageNumber = typeof page.pageNumber === "number" ? page.pageNumber : index + 1
    const pageLabel = typeof page.pageLabel === "string" && page.pageLabel.trim() ? page.pageLabel.trim() : `Page ${pageNumber}`
    return [{ key: `${pageNumber}-${index}`, label: pageLabel, text: lines.join("\n") }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toPreviewUpload(upload: UploadWithUrl): PreviewUpload {
  return {
    filename: upload.filename,
    fileKind: upload.fileKind,
    mimeType: upload.mimeType,
    url: upload.url
  }
}

function combinedAnnotationScene(reviews: TaskReview[]) {
  return {
    version: "redpen-excalidraw-compatible-v1",
    elements: reviews.flatMap((review) => review.annotationScene?.elements ?? [])
  }
}

function oneYearFromNow() {
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  return expiresAt.toISOString()
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}
