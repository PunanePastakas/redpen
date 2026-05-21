"use client"

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs"
import { ConvexReactClient } from "convex/react"
import { useMemo, type ReactNode } from "react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexUrl) {
    return <>{children}</>
  }

  return <LiveConvexClientProvider convexUrl={convexUrl}>{children}</LiveConvexClientProvider>
}

function LiveConvexClientProvider({ children, convexUrl }: { children: ReactNode; convexUrl: string }) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl])

  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>
}
