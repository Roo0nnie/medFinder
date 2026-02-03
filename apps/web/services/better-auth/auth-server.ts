import { cache } from "react"
import { cookies } from "next/headers"

import { env } from "@/env"

/**
 * User type from Better Auth
 */
export interface User {
	id: string
	email: string
	name: string | null
	image: string | null
	emailVerified?: boolean
	createdAt?: string
	updatedAt?: string
}

/**
 * Session data from Better Auth
 */
export interface SessionData {
	id: string
	expiresAt: string
	token: string
	createdAt: string
	updatedAt: string
	ipAddress?: string
	userAgent?: string
	userId: string
}

/**
 * Combined session type matching Better Auth's full response
 */
export interface Session {
	user: User
	session: SessionData
}

/**
 * Better Auth full response (session + user)
 * Can be null if not authenticated, or object with session and user
 */
type BetterAuthResponse = null | {
	session: SessionData
	user: User
}

/**
 * Better Auth error response
 */
interface BetterAuthError {
	error?: {
		message: string
		code?: string
	}
}

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
 * Proxies request to backend's /api/auth/get-session endpoint.
 * Returns session data if authenticated, null otherwise.
 *
 * @returns Promise<Session | null> - The session data or null if not authenticated
 */
export const getSession = cache(async (): Promise<Session | null> => {
	const cookieStore = await cookies()
	const cookieHeader = cookieStore
		.getAll()
		.map(cookie => `${cookie.name}=${cookie.value}`)
		.join("; ")

	const response = await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/get-session`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"cookie": cookieHeader,
		},
		cache: "no-store",
	})

	if (!response.ok) {
		return null
	}

	const data: BetterAuthResponse | BetterAuthError = await response.json()

	// Handle error response
	if (!data || (typeof data === "object" && "error" in data)) {
		return null
	}

	// Handle null response (not authenticated)
	if (data === null) {
		return null
	}

	// Response should have both session and user
	if ("session" in data && "user" in data) {
		return data as Session
	}

	// Fallback: if response has session-like fields at top level
	// This handles cases where backend returns session data in a different format
	// TODO: The backend should be returning {session, user} according to Better Auth schema
	if ("userId" in data && "expiresAt" in data) {
		// Return partial session with minimal user info
		return {
			session: data as unknown as SessionData,
			user: {
				id: (data as { userId: string }).userId,
				email: "", // Would need separate endpoint to get full user data
				name: null,
				image: null,
			},
		}
	}

	return null
})
