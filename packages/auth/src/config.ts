import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { openAPI } from "better-auth/plugins"

import { createDBClient } from "@repo/db/client"
import { accounts, sessions, users, verifications } from "@repo/db/schema"

/**
 * Creates a Better Auth instance configured with Drizzle adapter.
 *
 * The auth instance uses the database connection from @repo/db and is
 * configured to work across multiple apps (backend, web, mobile via API).
 *
 * @returns Better Auth instance
 */
export function createAuth(): ReturnType<typeof betterAuth> {
	const db = createDBClient()

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: {
				users,
				sessions,
				accounts,
				verifications,
			},
			usePlural: true,
		}),
		// Include /api prefix since nestjs-better-auth bypasses NestJS global prefix.
		basePath: "/api/auth",
		baseURL:
			process.env.BETTER_AUTH_URL ??
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
			"http://localhost:3000",
		secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
			? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
			: ["http://localhost:3000", "http://localhost:3001"],
		plugins: [
			openAPI({
				// Served under /api/auth/reference because basePath is /auth and Nest adds /api
				path: "/reference",
			}),
		],
	})
}

/**
 * Default Better Auth instance.
 * This is the shared instance used across all apps.
 *
 * Lazy initialization to ensure environment variables are loaded before creating the instance.
 */
let _auth: ReturnType<typeof betterAuth> | null = null

export function getAuth(): ReturnType<typeof betterAuth> {
	if (!_auth) {
		_auth = createAuth()
	}
	return _auth
}
