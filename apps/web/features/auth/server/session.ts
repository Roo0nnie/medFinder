import { cache } from "react"
import { cookies } from "next/headers"

/**
 * Import inferred Session type from Better Auth configuration.
 * This ensures types always match to backend's Better Auth setup.
 */
import { type AuthSession } from "@repo/auth"

import { getAuthUrl } from "@/services/better-auth/auth-utils"

/**
 * Server-side auth proxy for web app.
 *
 * Proxies authentication requests to NestJS backend, allowing server components
 * to verify user sessions without direct database access.
 *
 * Uses React's cache to avoid duplicate requests during a render pass.
 */

/**
 * Get current user session from backend.
 *
 * Proxies request to backend's /api/{version}/auth/get-session endpoint.
 * Returns session data if authenticated, null otherwise.
 *
 * @returns Promise<Session | null> - The session data or null if not authenticated
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
	const cookieStore = await cookies()
	const cookieHeader = cookieStore
		.getAll()
		.map(cookie => `${cookie.name}=${cookie.value}`)
		.join("; ")

	const authUrl = getAuthUrl()
	const url = `${authUrl}/get-session`

	const response = await fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"cookie": cookieHeader,
		},
		cache: "no-store",
	})

	if (!response.ok) return null

	const data = await response.json()

	// Handle null response (not authenticated)
	if (data === null) return null

	// Handle error response
	if (typeof data === "object" && "error" in data) return null

	// Session contains userId at top level, not nested under user
	return data as AuthSession | null
})
