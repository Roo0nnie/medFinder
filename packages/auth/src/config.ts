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
		// Do not include the global Nest prefix here; Nest adds `api/` already.
		basePath: "/auth",
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

/**
 * Default Better Auth instance (lazy getter).
 *
 * Uses a Proxy to ensure the instance is created on first access.
 * This ensures environment variables are loaded before initialization.
 *
 * Note: The Proxy properly forwards all properties including `handler`
 * which is required by NestJS Better Auth adapter.
 */
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
	get(_target, prop) {
		const instance = getAuth()
		const value = instance[prop as keyof ReturnType<typeof betterAuth>]
		// Ensure functions are bound to the instance
		if (typeof value === "function") {
			return value.bind(instance)
		}
		return value
	},
	has(_target, prop) {
		return prop in getAuth()
	},
	getOwnPropertyDescriptor(_target, prop) {
		return Object.getOwnPropertyDescriptor(getAuth(), prop)
	},
	ownKeys(_target) {
		return Reflect.ownKeys(getAuth())
	},
})
