import { cache } from "react"

import { type AuthSession } from "@repo/auth"

import { getCookieHeader } from "@/core/lib/cookie-utils"

import { getAuthUrl } from "./lib/utils"

/**
 * Get current user session from backend.
 *
 * Proxies request to backend's /get-session endpoint with cookie forwarding.
 * Returns session data if authenticated, null otherwise.
 *
 * @returns Promise<AuthSession | null> - The session data or null
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
	try {
		const cookieHeader = await getCookieHeader()

		const response = await fetch(`${getAuthUrl()}/get-session`, {
			headers: {
				"Content-Type": "application/json",
				"cookie": cookieHeader,
			},
			cache: "no-store",
		})

		if (!response.ok) {
			// eslint-disable-next-line no-console
			console.error("Failed to get session:", response.status, response.statusText)
			return null
		}

		return await response.json()
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Backend fetch error:", error)
		return null
	}
})
