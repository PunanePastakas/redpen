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
import { Panel } from "@/components/ui/panel"
import { StatusBadge } from "@/components/ui/status-badge"

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
        <Panel className="mx-auto max-w-xl text-center" variant="paper">
          <h1 className="text-2xl font-semibold">Laen tulemust</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--rp-muted)]">Kontrollin jagatud lingi õigusi.</p>
        </Panel>
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
      <Panel className="mx-auto max-w-3xl p-6" variant="paper">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--rp-border)] pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[var(--rp-primary-strong)]">RedPen jagatud tulemus</p>
            <h1 className="font-display mt-2 text-3xl font-semibold">{result.testTitle}</h1>
            <p className="mt-2 text-sm text-[var(--rp-muted)]">
              Kinnitas {result.teacherName}
              {result.confirmedAt ? ` · ${result.confirmedAt}` : null}
            </p>
          </div>
          <StatusBadge icon={<ShieldCheck aria-hidden="true" size={16} />} tone="success">
            Õpetaja kinnitatud
          </StatusBadge>
        </div>

        <div className="mt-5">
          <AITransparencyMarker variant="banner" contentType="tagasiside mustand" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {result.totalPoints !== undefined ? (
            <div className="rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface)] p-4">
              <p className="text-sm text-[var(--rp-muted)]">Punktid</p>
              <p className="mt-1 text-2xl font-semibold">
                {result.totalPoints} / {result.maxPoints ?? "-"}
              </p>
            </div>
          ) : null}
          {result.grade ? (
            <div className="rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface)] p-4">
              <p className="text-sm text-[var(--rp-muted)]">Hinne</p>
              <p className="mt-1 text-2xl font-semibold">{result.grade}</p>
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Lõplik tagasiside</h2>
          <div className="mt-3 whitespace-pre-line rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface-subtle)] p-4 text-base leading-7">
            <MathText text={result.finalFeedback} />
          </div>
        </section>

        {annotations.length ? (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Märkused tööle</h2>
            <ul className="mt-3 space-y-3">
              {annotations.map((annotation, index) => (
                <li key={annotation.id ?? index} className="rounded-[var(--rp-radius-panel)] border border-[var(--rp-border)] bg-[var(--rp-surface)] p-4">
                  <p className="font-medium">{annotation.label ?? "Märkus"}</p>
                  {annotation.semanticEvidence ? (
                    <div className="mt-1 text-sm text-[var(--rp-muted)]">
                      <MathText text={annotation.semanticEvidence} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Panel>
    </StudentResultFrame>
  )
}

function StudentResultFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <GlobalNavbar />
      <div className="px-4 py-8">{children}</div>
    </main>
  )
}

function DeniedState({ title, body }: { title: string; body: string }) {
  return (
    <Panel className="mx-auto max-w-xl p-6" variant="danger">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--rp-radius-control)] border border-[var(--rp-correction)] bg-[var(--rp-correction-soft)] text-[var(--rp-correction)]">
        <LockKeyhole aria-hidden="true" size={20} />
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--rp-muted)]">{body}</p>
      <Link className="mt-6 inline-flex min-h-10 items-center rounded-[var(--rp-radius-control)] border border-[var(--rp-ink)] bg-[var(--rp-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_var(--rp-ink)] hover:bg-[var(--rp-primary-strong)]" href="/">
        Tagasi RedPeni
      </Link>
    </Panel>
  )
}
