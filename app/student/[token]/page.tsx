import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { GlobalNavbar } from "@/components/global-navbar"

type StudentTokenPageProps = {
  params: Promise<{ token: string }>
}

export default async function StudentTokenPage({ params }: StudentTokenPageProps) {
  await params

  return (
    <main className="min-h-screen bg-[#f6f8f5]">
      <GlobalNavbar />
      <div className="px-4 py-10">
        <section className="mx-auto max-w-xl rounded-lg border border-[#dbe2dc] bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">
            <LockKeyhole aria-hidden="true" size={20} />
          </div>
          <h1 className="text-2xl font-semibold">Tulemuse link on puudulik</h1>
          <p className="mt-3 text-sm leading-6 text-[#647067]">
            RedPen jagatud tulemus vajab nii õpilase kutsetokenit kui ka tulemuse tunnust. Palu õpetajal saata uus link.
          </p>
          <Link className="mt-6 inline-flex rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white" href="/">
            Tagasi RedPeni
          </Link>
        </section>
      </div>
    </main>
  )
}
