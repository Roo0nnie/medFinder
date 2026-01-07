import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 */
export const { signIn, signUp, signOut, useSession } = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
})
