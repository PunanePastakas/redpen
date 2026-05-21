"use client"

import { useState } from "react"
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { LogIn, LogOut, UserPlus } from "lucide-react"
import { api } from "@/convex/_generated/api"

const convexAuthEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)

export function AuthPanel() {
  if (!convexAuthEnabled) {
    return (
      <div className="rounded-md border border-[#dbe2dc] px-3 py-2 text-xs font-semibold text-[#526059]">
        Setup required
      </div>
    )
  }

  return <LiveAuthPanel />
}

export function SignUpSection() {
  if (!convexAuthEnabled) {
    return null
  }

  return (
    <section className="rounded-lg border border-[#dbe2dc] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#eef8f6] text-[#0f766e]">
          <UserPlus aria-hidden="true" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create your teacher workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[#647067]">Start with your own tests, grading context, and student work.</p>
        </div>
      </div>
      <PasswordSignUp />
    </section>
  )
}

function LiveAuthPanel() {
  return (
    <>
      <AuthLoading>
        <div className="rounded-md border border-[#dbe2dc] px-3 py-2 text-xs font-semibold text-[#526059]">Checking session</div>
      </AuthLoading>
      <Unauthenticated>
        <PasswordSignIn />
      </Unauthenticated>
      <Authenticated>
        <SignedInUser />
      </Authenticated>
    </>
  )
}

function PasswordSignIn() {
  const { signIn } = useAuthActions()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setPending(true)
        const formData = new FormData(event.currentTarget)
        void signIn("password", formData)
          .catch((signInError: unknown) => {
            setError(signInError instanceof Error ? signInError.message : "Authentication failed")
          })
          .finally(() => setPending(false))
      }}
    >
      <input name="flow" type="hidden" value="signIn" />
      <input
        className="h-9 w-44 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
        name="email"
        placeholder="Email"
        type="email"
        required
      />
      <input
        className="h-9 w-36 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
        name="password"
        placeholder="Password"
        type="password"
        required
      />
      <button
        className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <LogIn size={16} />
        {pending ? "Wait" : "Sign in"}
      </button>
      {error ? <span className="text-xs font-semibold text-[#b42318]">{error}</span> : null}
    </form>
  )
}

function PasswordSignUp() {
  const { signIn } = useAuthActions()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setPending(true)
        const formData = new FormData(event.currentTarget)
        void signIn("password", formData)
          .catch((signUpError: unknown) => {
            setError(signUpError instanceof Error ? signUpError.message : "Account creation failed")
          })
          .finally(() => setPending(false))
      }}
    >
      <input name="flow" type="hidden" value="signUp" />
      <input
        className="rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
        name="name"
        placeholder="Name"
        required
      />
      <input
        className="rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
        name="email"
        placeholder="Email"
        type="email"
        required
      />
      <input
        className="rounded-md border border-[#cbd5ce] px-3 py-2 text-sm outline-none focus:border-[#0f766e]"
        name="password"
        placeholder="Password"
        type="password"
        required
      />
      <button
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating" : "Sign up"}
      </button>
      {error ? <p className="text-sm font-semibold text-[#b42318]">{error}</p> : null}
    </form>
  )
}

function SignedInUser() {
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.current, {})
  const displayName = user?.name || user?.email || "Teacher"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="max-w-56 truncate rounded-md border border-[#dbe2dc] bg-[#f7faf8] px-3 py-2 text-sm font-semibold text-[#36433b]">
        {displayName}
      </span>
      <button
        className="inline-flex items-center gap-2 rounded-md border border-[#dbe2dc] px-3 py-2 text-sm font-semibold hover:bg-[#f7faf8]"
        onClick={() => void signOut()}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
