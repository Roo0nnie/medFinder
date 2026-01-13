import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 *
 * Points to the Next.js API route handler at /api/auth/[...all]
 * The basePath should match the API route path
 */
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"),
	basePath: "/api/auth",
})
