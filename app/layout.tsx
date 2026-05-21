import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"
import type { Metadata } from "next"
import { ConvexClientProvider } from "./convex-client-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "RedPen",
  description: "Teacher-controlled AI-assisted mathematics grading workbench"
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = (
    <html lang="et">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return content
  }

  return (
    <ConvexAuthNextjsServerProvider storage="localStorage" verbose={false}>
      {content}
    </ConvexAuthNextjsServerProvider>
  )
}
