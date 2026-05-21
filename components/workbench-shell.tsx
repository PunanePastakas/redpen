"use client"

import { useMemo, useRef, useState, type FormEvent } from "react"
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Languages,
  Link2,
  Loader2,
  Pencil,
  Play,
  Plus,
  Save,
  Share2,
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
import { StatusPill } from "@/components/status-pill"
import { sha256FileHex } from "@/lib/browser-hashing"
import { inferFileKind, validateUploadFile, type UploadRole } from "@/lib/file-validation"

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
    <main className="min-h-screen bg-[#f6f8f5]">
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe2dc] bg-white text-[#0f766e]">
          <FileText aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-5 text-3xl font-semibold">Grade math tests 10x faster</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#647067]">
          Upload student works, get automatic AI assessment, approve and share with students.
        </p>
      </section>
      <SignUpSection />
    </div>
  )
}

function SetupRequiredShell() {
  return (
    <main className="min-h-screen bg-[#f6f8f5]">
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
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const recordUploadedFile = useMutation(api.uploads.recordUploadedFile)
  const createWork = useMutation(api.works.create)
  const requestAnalysis = useMutation(api.works.requestAnalysis)
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
  const [showCreateTestForm, setShowCreateTestForm] = useState(false)
  const [creatingTest, setCreatingTest] = useState(false)
  const [uploading, setUploading] = useState(false)
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
  const contextInputRef = useRef<HTMLInputElement>(null)
  const workInputRef = useRef<HTMLInputElement>(null)

  const activeTestId = useMemo(() => {
    if (!tests?.length) return null
    return tests.find((test) => test._id === selectedTestId)?._id ?? tests[0]!._id
  }, [selectedTestId, tests])
  const selectedTest = tests?.find((test) => test._id === activeTestId) ?? null
  const uploads = useQuery(api.uploads.listByTest, activeTestId ? { testId: activeTestId } : "skip") as UploadWithUrl[] | undefined
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
  const selectedWorkFiles = useMemo(() => (workUploads ?? []).filter((upload) => upload.role === "student_work"), [workUploads])
  const selectedPreview = selectedWorkFiles[0] ? toPreviewUpload(selectedWorkFiles[0]) : null
  const annotations = useMemo(
    () => ((selectedReview?.annotationScene?.elements ?? []) as AnnotationTarget[]).filter((annotation) => annotation.rejectionReason === null),
    [selectedReview]
  )
  const totalPoints = useMemo(() => (taskReviews ?? []).reduce((sum, review) => sum + (review.pointsConfirmed ?? 0), 0), [taskReviews])
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
      setShowCreateTestForm(false)
      setMessage(guideFile ? "Test created and grading guide uploaded." : "Test created.")
    } catch (createError) {
      if (createdTestId) {
        setNewTest(emptyNewTestDraft())
        setShowCreateTestForm(false)
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
      if (contextInputRef.current) contextInputRef.current.value = ""
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
        maxPoints: selectedTest.maxPoints,
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

  if (tests.length === 0) {
    return (
      <>
        <GlobalNavbar shareLink={shareLink} />
        <div className="mx-auto max-w-3xl p-4">
          <CreateTestPanel newTest={newTest} onChange={setNewTest} onSubmit={handleCreateTest} pending={creatingTest} />
          <StatusMessages message={message} error={error} />
        </div>
      </>
    )
  }

  return (
    <>
      <GlobalNavbar shareLink={shareLink} />
      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)_430px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Kontrolltööd</h2>
              <button className="rounded-md p-2 text-[#0f766e] hover:bg-[#eef8f6]" title="Create test" aria-label="Create test" onClick={() => setShowCreateTestForm((value) => !value)}>
                <Plus size={17} />
              </button>
            </div>
            {showCreateTestForm ? (
              <div className="mt-3">
                <CreateTestPanel compact newTest={newTest} onChange={setNewTest} onSubmit={handleCreateTest} pending={creatingTest} />
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              {tests.map((test) => (
                <button
                  key={test._id}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    activeTestId === test._id ? "border-[#0f766e] bg-[#f0fdfa]" : "border-[#dbe2dc] bg-white hover:bg-[#f7faf8]"
                  }`}
                  onClick={() => {
                    setSelectedTestId(test._id)
                    setSelectedWorkId(null)
                    setLatestResultId(null)
                    setShareLink(null)
                  }}
                >
                  <span className="font-semibold">{test.title}</span>
                  <span className="mt-1 block text-xs text-[#647067]">
                    {test.gradeLevel || "klass puudub"} · {test.maxPoints ?? "-"} punkti · {test.defaultFeedbackLanguage}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Tööd</h2>
            {works && works.length > 0 ? (
              <div className="mt-3 space-y-2">
                {works.map((work, index) => (
                  <button
                    key={work._id}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      activeWorkId === work._id ? "border-[#0f766e] bg-[#f0fdfa]" : "border-[#dbe2dc] bg-white hover:bg-[#f7faf8]"
                    }`}
                    onClick={() => {
                      setSelectedWorkId(work._id)
                      setLatestResultId(null)
                      setShareLink(null)
                    }}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{work.detectedName || `Töö ${index + 1}`}</span>
                      <StatusPill status={work.status} />
                    </span>
                    {work.error ? <span className="mt-2 block text-xs text-[#b42318]">{work.error}</span> : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#647067]">Sellel testil pole veel ühtegi üles laaditud tööd.</p>
            )}
            <input
              ref={workInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              multiple
              onChange={(event) => void handleWorkUpload(event.target.files)}
            />
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
              disabled={!activeTestId || uploading}
              onClick={() => workInputRef.current?.click()}
            >
              <Upload size={16} />
              Upload works
            </button>
          </section>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#526059]">
                <FileText size={16} />
                Hindamisjuhend / Grading guide
              </div>
              <p className="mt-2 text-sm">{contextUploads.length} file(s) attached</p>
              <div className="mt-2 space-y-1">
                {contextUploads.slice(0, 3).map((upload) => (
                  <p key={upload._id} className="truncate text-xs text-[#647067]">{upload.filename}</p>
                ))}
              </div>
              <input
                ref={contextInputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,application/pdf,text/plain"
                multiple
                onChange={(event) => void handleContextUpload(event.target.files)}
              />
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
                disabled={!activeTestId || uploading}
                onClick={() => contextInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload guide
              </button>
            </div>
            <div className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#526059]">
                <Upload size={16} />
                Student work
              </div>
              <p className="mt-2 text-sm">{selectedWorkFiles[0]?.filename ?? "No work selected"}</p>
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
                disabled={!selectedWork || runningStatuses.includes(selectedWork.status)}
                onClick={() => void runAnalysis()}
              >
                {selectedWork && runningStatuses.includes(selectedWork.status) ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                Run analysis
              </button>
            </div>
            <div className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#526059]">
                <Languages size={16} />
                Feedback language
              </div>
              <p className="mt-3 text-2xl font-semibold">{selectedTest?.defaultFeedbackLanguage === "et" ? "Eesti" : "English"}</p>
              <p className="mt-1 text-xs text-[#647067]">Configured per test.</p>
            </div>
          </section>

          <StatusMessages message={message} error={error} />

          <DocumentViewer
            file={selectedPreview}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={setSelectedAnnotationId}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Review queue</h2>
                <p className="mt-1 text-sm text-[#647067]">{taskReviews?.length ? "Accept, edit, reject, or replace every draft." : "No AI drafts yet."}</p>
              </div>
              {taskReviews?.length ? <AITransparencyMarker variant="badge" /> : null}
            </div>
            {taskReviews?.length ? (
              <div className="mt-3 space-y-2">
                {taskReviews.map((review) => (
                  <button
                    key={review._id}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      activeTaskReviewId === review._id ? "border-[#0f766e] bg-[#f0fdfa]" : "border-[#dbe2dc] hover:bg-[#f7faf8]"
                    }`}
                    onClick={() => setSelectedTaskReviewId(review._id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{review.stableKey}</span>
                      <span className="text-xs text-[#647067]">{review.status.replace("_", " ")}</span>
                    </span>
                    <span className="mt-1 block text-xs text-[#647067]">
                      Suggested {review.pointsSuggested ?? "-"} pts
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#647067]">Upload a work and run analysis to create reviewable drafts.</p>
            )}
          </section>

          {selectedReview ? (
            <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
              <h2 className="font-semibold">{selectedReview.stableKey}</h2>
              <div className="mt-4">
                <AITransparencyMarker variant="inline" contentType="tagasiside" />
              </div>
              <label className="mt-4 block text-sm font-semibold" htmlFor="feedback-draft">
                Final feedback
              </label>
              <textarea
                key={selectedReview._id}
                id="feedback-draft"
                className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cbd5ce] p-3 text-sm leading-6 outline-none focus:border-[#0f766e]"
                defaultValue={selectedReview.feedbackConfirmed ?? selectedReview.feedbackDraft}
                onBlur={(event) => void updateSelectedReview({ status: "edited", feedbackConfirmed: event.target.value })}
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Points
                  <input
                    key={`${selectedReview._id}-points`}
                    className="mt-2 w-full rounded-md border border-[#cbd5ce] px-3 py-2 outline-none focus:border-[#0f766e]"
                    type="number"
                    min={0}
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
                  <select
                    className="mt-2 w-full rounded-md border border-[#cbd5ce] px-3 py-2 outline-none focus:border-[#0f766e]"
                    value={selectedReview.status}
                    onChange={(event) => void updateSelectedReview({ status: event.target.value as ReviewStatus })}
                  >
                    <option value="needs_review">Needs review</option>
                    <option value="accepted">Accepted</option>
                    <option value="edited">Edited</option>
                    <option value="rejected">Rejected</option>
                    <option value="manual">Manual</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#115e59]" onClick={() => void updateSelectedReview({ status: "accepted" })}>
                  <Check size={16} />
                  Accept
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]" onClick={() => void updateSelectedReview({ status: "manual", feedbackConfirmed: "" })}>
                  <Pencil size={16} />
                  Replace
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Student link</h2>
            {selectedStudent ? (
              <p className="mt-2 text-sm text-[#647067]">Linked to {selectedStudent.displayName}</p>
            ) : (
              <p className="mt-2 text-sm text-[#647067]">Link or create a student before confirmation and sharing.</p>
            )}
            {students?.length ? (
              <select
                className="mt-3 w-full rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
                value={currentExistingStudentId}
                onChange={(event) => setStudentDraft({ workId: activeWorkId, name: currentStudentName, existingStudentId: event.target.value as Id<"students"> | "" })}
              >
                <option value="">Create from name below</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>{student.displayName}</option>
                ))}
              </select>
            ) : null}
            <input
              className="mt-3 w-full rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
              placeholder="Student name"
              value={currentStudentName}
              onChange={(event) => setStudentDraft({ workId: activeWorkId, name: event.target.value, existingStudentId: currentExistingStudentId })}
            />
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
              disabled={!selectedWork}
              onClick={() => void linkStudent()}
            >
              <UserPlus size={16} />
              Link student
            </button>
          </section>

          <section className="rounded-lg border border-[#dbe2dc] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Final result</h2>
            <p className="mt-2 text-sm text-[#647067]">Total: {totalPoints} / {selectedTest?.maxPoints ?? "-"}</p>
            <textarea
              className="mt-3 min-h-24 w-full resize-y rounded-md border border-[#cbd5ce] p-3 text-sm leading-6 outline-none focus:border-[#0f766e]"
              placeholder="Final feedback"
              value={currentFinalFeedback}
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
            <input
              className="mt-3 w-full rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
              placeholder="Optional grade"
              value={currentGrade}
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
              <label className="flex items-center justify-between gap-3 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm">
                Show points to student
                <input
                  type="checkbox"
                  checked={currentShowPoints}
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
              <label className="flex items-center justify-between gap-3 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm">
                Show grade to student
                <input
                  type="checkbox"
                  checked={currentShowGrade}
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
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#115e59]"
                onClick={() => void confirmSelectedResult()}
                disabled={!selectedWork || !linkedStudentId || !allReviewed || !currentFinalFeedback.trim()}
                title={!linkedStudentId ? "Link a student before confirmation" : allReviewed ? "Confirm result" : "Review every task before confirmation"}
              >
                <Save size={16} />
                Confirm
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
                onClick={() => void shareSelectedResult()}
                disabled={!activeResultId || !linkedStudentId}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
                onClick={copyMockExport}
                disabled={!mockExport}
              >
                <Copy size={16} />
                {mockExportCopied ? "Copied" : "Mock export"}
              </button>
              {shareLink ? (
                <a className="inline-flex items-center justify-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]" href={shareLink}>
                  <Link2 size={16} />
                  Open link
                </a>
              ) : null}
            </div>
          </section>
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
    <section className={compact ? "" : "rounded-lg border border-[#dbe2dc] bg-white p-5 shadow-sm"}>
      {!compact ? <h2 className="text-xl font-semibold">Create your first test</h2> : null}
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="text-sm font-semibold">
          Title
          <input
            className="mt-2 w-full rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
            placeholder="Algebra kontrolltöö"
            required
            value={newTest.title}
            onChange={(event) => onChange({ ...newTest, title: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold">
          Feedback language
          <select
            className="mt-2 w-full rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
            value={newTest.defaultFeedbackLanguage}
            onChange={(event) => onChange({ ...newTest, defaultFeedbackLanguage: event.target.value as FeedbackLanguage })}
          >
            <option value="et">Eesti</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Hindamisjuhend / Grading guide <span className="font-normal text-[#647067]">(optional)</span>
          <input
            key={newTest.gradingGuideFile ? "guide-selected" : "guide-empty"}
            className="mt-2 w-full rounded-md border border-[#cbd5ce] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#eef8f6] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#0f766e] hover:file:bg-[#dff2ef]"
            type="file"
            accept="image/jpeg,image/png,application/pdf,text/plain"
            onChange={(event) => onChange({ ...newTest, gradingGuideFile: event.target.files?.[0] ?? null })}
          />
        </label>
        {newTest.gradingGuideFile ? (
          <p className="text-xs leading-5 text-[#647067]">
            {newTest.gradingGuideFile.name} will be uploaded as grading context for LLM analysis.
          </p>
        ) : null}
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#8fb8b3]" disabled={pending || !newTest.title.trim()}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Create test
        </button>
      </form>
    </section>
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
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe2dc] bg-white text-[#0f766e]">
        <FileText aria-hidden="true" size={22} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#647067]">{body}</p>
    </div>
  )
}

function StatusMessages({ message, error }: { message: string | null; error: string | null }) {
  if (!message && !error) return null
  return (
    <div className="space-y-2">
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          <AlertTriangle aria-hidden="true" size={16} />
          {error}
        </div>
      ) : null}
    </div>
  )
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
