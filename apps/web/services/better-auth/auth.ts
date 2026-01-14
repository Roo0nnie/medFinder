import { getAuth } from "@repo/auth"

/**
 * Server-side Better Auth helpers for the web app.
 *
 * This wraps the shared auth configuration from @repo/auth so that
 * server components and route handlers in the web app can import
 * a ready-to-use auth instance.
 */
export { getAuth } from "@repo/auth"

export const auth = getAuth()
