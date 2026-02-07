import { cookies } from "next/headers"

/**
 * Gets the cookie header from the current request.
 *
 * This is used for server-side API calls that need to forward authentication cookies
 * to the backend.
 *
 * @returns Promise<string> - Cookie header string or empty string if no cookies
 */
export async function getCookieHeader(): Promise<string> {
	const cookieStore = await cookies()
	return cookieStore
		.getAll()
		.map(cookie => `${cookie.name}=${cookie.value}`)
		.join("; ")
}
