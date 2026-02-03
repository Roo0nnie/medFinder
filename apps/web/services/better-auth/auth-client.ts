import { createAuthClient } from "better-auth/react"

import { env } from "@/env"

/**
 * Helper function to construct auth URL from base API URL and version
 * @returns Full auth URL
 */
function getAuthUrl(): string {
	return `${env.NEXT_PUBLIC_API_BASE_URL}/${env.NEXT_PUBLIC_API_VERSION}/auth`
}

/**
 * Better Auth client for React components
 * Provides hooks like useSession, signIn, signOut, etc.
 *
 * Points to the NestJS backend for auth operations.
 * The auth URL is constructed dynamically from base API URL and version.
 */
export const authClient = createAuthClient({
	baseURL: getAuthUrl(),
})
