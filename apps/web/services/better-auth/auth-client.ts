import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 *
 * Points to the NestJS backend at localhost:3000 for auth operations.
 * The basePath should match the backend's auth route prefix.
 */
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
	basePath: "/api/auth",
})
