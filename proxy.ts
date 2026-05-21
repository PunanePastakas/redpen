import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server"
import type { NextFetchEvent, NextRequest } from "next/server"
import { NextResponse } from "next/server"

const authProxy = convexAuthNextjsMiddleware(undefined, {
  cookieConfig: { maxAge: 60 * 60 * 24 * 30 },
  verbose: false
})

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return NextResponse.next()
  }

  return authProxy(request, event)
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
}
