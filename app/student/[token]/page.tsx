import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { GlobalNavbar } from "@/components/global-navbar"
import { Panel } from "@/components/ui/panel"

type StudentTokenPageProps = {
  params: Promise<{ token: string }>
}

export default async function StudentTokenPage({ params }: StudentTokenPageProps) {
  await params

  return (
    <main className="min-h-screen">
      <GlobalNavbar />
      <div className="px-4 py-10">
        <Panel className="mx-auto max-w-xl p-6" variant="danger">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--rp-radius-control)] border border-[var(--rp-correction)] bg-[var(--rp-correction-soft)] text-[var(--rp-correction)]">
            <LockKeyhole aria-hidden="true" size={20} />
          </div>
          <h1 className="text-2xl font-semibold">Tulemuse link on puudulik</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--rp-muted)]">
            RedPen jagatud tulemus vajab nii õpilase kutsetokenit kui ka tulemuse tunnust. Palu õpetajal saata uus link.
          </p>
          <Link className="mt-6 inline-flex min-h-10 items-center rounded-[var(--rp-radius-control)] border border-[var(--rp-ink)] bg-[var(--rp-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_var(--rp-ink)] hover:bg-[var(--rp-primary-strong)]" href="/">
            Tagasi RedPeni
          </Link>
        </Panel>
      </div>
    </main>
  )
}
