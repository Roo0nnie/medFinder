import { cache } from "react"

import { env } from "@/env"

/**
 * Auth URL for Better Auth (served by Next.js at /api/auth).
 * Uses the web app origin so login/sign-up hit this app's API route.
 *
 * @returns Full auth URL (e.g., "http://localhost:3001/api/auth")
 */
export const getAuthUrl = cache(() => {
	return `${env.NEXT_PUBLIC_APP_URL}/api/auth`
})
