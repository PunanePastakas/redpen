"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useQuery } from "convex/react"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { AITransparencyMarker } from "@/components/ai-transparency-marker"
import { GlobalNavbar } from "@/components/global-navbar"
import { MathText } from "@/components/math-text"

const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)

export function StudentResultView({ token, resultId }: { token: string; resultId: string }) {
  if (!convexEnabled) {
    return (
      <StudentResultFrame>
        <DeniedState title="Live setup required" body="This shared result can only be read after Convex is configured." />
      </StudentResultFrame>
    )
  }

  return <LiveStudentResult token={token} resultId={resultId as Id<"studentResults">} />
}

function LiveStudentResult({ token, resultId }: { token: string; resultId: Id<"studentResults"> }) {
  const result = useQuery(api.results.getSharedByInviteToken, { token, resultId })

  if (result === undefined) {
    return (
      <StudentResultFrame>
        <section className="mx-auto max-w-xl rounded-lg border border-[#dbe2dc] bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Laen tulemust</h1>
          <p className="mt-3 text-sm leading-6 text-[#647067]">Kontrollin jagatud lingi õigusi.</p>
        </section>
      </StudentResultFrame>
    )
  }

  if (result === null) {
    return (
      <StudentResultFrame>
        <DeniedState title="Juurdepääs puudub" body="See link on aegunud, tühistatud või ei ole seotud jagatud kinnitatud tagasisidega." />
      </StudentResultFrame>
    )
  }

  const annotations = ((result.annotationScene?.elements ?? []) as Array<{ id?: string; label?: string; semanticEvidence?: string }>).filter(Boolean)

  return (
    <StudentResultFrame>
      <section className="mx-auto max-w-3xl rounded-lg border border-[#dbe2dc] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dbe2dc] pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#0f766e]">RedPen jagatud tulemus</p>
            <h1 className="mt-2 text-3xl font-semibold">{result.testTitle}</h1>
            <p className="mt-2 text-sm text-[#647067]">
              Kinnitas {result.teacherName}
              {result.confirmedAt ? ` · ${result.confirmedAt}` : null}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-[#b7dfd8] bg-[#f0fdfa] px-3 py-2 text-sm font-medium text-[#115e59]">
            <ShieldCheck aria-hidden="true" size={16} />
            Õpetaja kinnitatud
          </div>
        </div>

        <div className="mt-5">
          <AITransparencyMarker variant="banner" contentType="tagasiside mustand" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {result.totalPoints !== undefined ? (
            <div className="rounded-lg border border-[#dbe2dc] p-4">
              <p className="text-sm text-[#647067]">Punktid</p>
              <p className="mt-1 text-2xl font-semibold">
                {result.totalPoints} / {result.maxPoints ?? "-"}
              </p>
            </div>
          ) : null}
          {result.grade ? (
            <div className="rounded-lg border border-[#dbe2dc] p-4">
              <p className="text-sm text-[#647067]">Hinne</p>
              <p className="mt-1 text-2xl font-semibold">{result.grade}</p>
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Lõplik tagasiside</h2>
          <div className="mt-3 whitespace-pre-line rounded-lg border border-[#dbe2dc] bg-[#fbfcfa] p-4 text-base leading-7">
            <MathText text={result.finalFeedback} />
          </div>
        </section>

        {annotations.length ? (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Märkused tööle</h2>
            <ul className="mt-3 space-y-3">
              {annotations.map((annotation, index) => (
                <li key={annotation.id ?? index} className="rounded-lg border border-[#dbe2dc] bg-white p-4">
                  <p className="font-medium">{annotation.label ?? "Märkus"}</p>
                  {annotation.semanticEvidence ? (
                    <div className="mt-1 text-sm text-[#647067]">
                      <MathText text={annotation.semanticEvidence} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </StudentResultFrame>
  )
}

function StudentResultFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f8f5]">
      <GlobalNavbar />
      <div className="px-4 py-8">{children}</div>
    </main>
  )
}

function DeniedState({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-xl rounded-lg border border-[#dbe2dc] bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">
        <LockKeyhole aria-hidden="true" size={20} />
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#647067]">{body}</p>
      <Link className="mt-6 inline-flex rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white" href="/">
        Tagasi RedPeni
      </Link>
    </section>
  )
}
