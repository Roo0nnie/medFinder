import { cache } from "react"

import { env } from "@/env"

/**
 * Helper function to construct auth URL for server-side requests.
 * Combines the base API URL, version, and auth endpoint path.
 *
 * @returns Full auth URL (e.g., "http://localhost:3001/api/v1/auth")
 */
export const getAuthUrl = cache((): string => {
	const baseUrl = env.NEXT_PUBLIC_API_BASE_URL
	const apiVersion = env.NEXT_PUBLIC_API_VERSION
	return `${baseUrl}/${apiVersion}/auth`
})
