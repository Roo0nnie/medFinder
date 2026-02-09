import { cache } from "react"

import { getApiUrl } from "@/core/lib/utils"

/**
 * Helper function to construct auth URL for server-side requests.
 * Combines the base API URL, version, and auth endpoint path.
 *
 * @returns Full auth URL (e.g., "http://localhost:3001/api/v1/auth")
 */
export const getAuthUrl = cache(() => {
	return `${getApiUrl()}/auth`
})
