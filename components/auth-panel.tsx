"use client"

import { useState } from "react"
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { LogIn, LogOut, UserPlus } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Field, TextInput } from "@/components/ui/field"
import { Panel } from "@/components/ui/panel"

const convexAuthEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)

export function AuthPanel() {
  if (!convexAuthEnabled) {
    return (
      <div className="rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-xs font-semibold text-[var(--rp-muted-strong)]">
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
    <Panel variant="paper">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--rp-ink)] bg-[var(--rp-primary-soft)] text-[var(--rp-primary-strong)]">
          <UserPlus aria-hidden="true" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create your teacher workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--rp-muted)]">Start with your own tests, grading context, and student work.</p>
        </div>
      </div>
      <PasswordSignUp />
    </Panel>
  )
}

function LiveAuthPanel() {
  return (
    <>
      <AuthLoading>
        <div className="rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-xs font-semibold text-[var(--rp-muted-strong)]">Checking session</div>
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
      <TextInput
        className="h-9 w-44 py-0"
        name="email"
        placeholder="Email"
        type="email"
        required
      />
      <TextInput
        className="h-9 w-36 py-0"
        name="password"
        placeholder="Password"
        type="password"
        required
      />
      <Button
        className="h-9"
        disabled={pending}
        type="submit"
        variant="primary"
      >
        <LogIn size={16} />
        {pending ? "Wait" : "Sign in"}
      </Button>
      {error ? <span className="text-xs font-semibold text-[var(--rp-correction)]">{error}</span> : null}
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
      <Field label="Name">
        <TextInput name="name" placeholder="Name" required />
      </Field>
      <Field label="Email">
        <TextInput name="email" placeholder="Email" required type="email" />
      </Field>
      <Field label="Password">
        <TextInput name="password" placeholder="Password" required type="password" />
      </Field>
      <Button disabled={pending} type="submit" variant="primary">
        {pending ? "Creating" : "Sign up"}
      </Button>
      {error ? <p className="text-sm font-semibold text-[var(--rp-correction)]">{error}</p> : null}
    </form>
  )
}

function SignedInUser() {
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.current, {})
  const displayName = user?.name || user?.email || "Teacher"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="max-w-56 truncate rounded-[var(--rp-radius-control)] border border-[var(--rp-border)] bg-[var(--rp-surface)] px-3 py-2 text-sm font-semibold text-[var(--rp-text-soft)]">
        {displayName}
      </span>
      <Button
        onClick={() => void signOut()}
        variant="secondary"
      >
        <LogOut size={16} />
        Sign out
      </Button>
    </div>
  )
}
