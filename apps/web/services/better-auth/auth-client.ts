import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 *
 * Points to the backend API where Better Auth is configured.
 * Backend runs on port 3000 with global prefix "/api", and auth basePath is "/auth",
 * so auth routes are at "/api/auth"
 */
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
	basePath: "/api/auth",
})
