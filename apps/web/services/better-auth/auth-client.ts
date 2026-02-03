import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 *
 * Points to the NestJS backend for auth operations.
 * Uses NEXT_PUBLIC_BETTER_AUTH_URL which points to /api/auth on the backend.
 */
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
})
