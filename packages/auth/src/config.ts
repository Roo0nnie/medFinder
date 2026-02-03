import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { openAPI } from "better-auth/plugins"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

import { createDBClient } from "@repo/db/client"
import { accounts, sessions, users, verifications } from "@repo/db/schema"

/**
 * Type-safe environment variable validation for Auth package
 *
 * Validates auth-related environment variables at module load time.
 * This ensures all required auth configuration is present before initialization.
 */
export const authEnv = createEnv({
	server: {
		// API Configuration
		API_VERSION: z.string(),

		// Authentication
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_TRUSTED_ORIGINS: z.string(),

		// OAuth Providers (Google)
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})

/**
 * Creates a Better Auth instance configured with Drizzle adapter.
 *
 * The auth instance uses database connection from @repo/db and is
 * configured to work across multiple apps (backend, web, mobile via API).
 *
 * Note: For server-side (backend), we let NestJS handle the routing at
 * /api/{version}/auth/*, so baseURL is intentionally set to undefined to avoid
 * duplicate path prefixing in generated OpenAPI docs.
 *
 * @returns Better Auth instance
 */
export function createAuth(): ReturnType<typeof betterAuth> {
	const db = createDBClient()
	const apiVersion = authEnv.API_VERSION
	const basePath = `/api/${apiVersion}/auth`

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
		basePath,
		// Don't set baseURL for server-side auth instance
		// NestJS handles routing at /api/{version}/auth/*
		// baseURL is only needed for client-side operations
		baseURL: undefined,
		secret: authEnv.BETTER_AUTH_SECRET,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		socialProviders: {
			google: {
				prompt: "select_account",
				clientId: authEnv.GOOGLE_CLIENT_ID as string,
				clientSecret: authEnv.GOOGLE_CLIENT_SECRET as string,
			},
		},
		trustedOrigins: authEnv.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [],
		plugins: [
			openAPI({
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

/**
 * Clear the cached auth instance. Call this when configuration changes.
 */
export function clearAuthCache(): void {
	_auth = null
}

export function getAuth(): ReturnType<typeof betterAuth> {
	if (!_auth) {
		_auth = createAuth()
	}
	return _auth!
}

/**
 * Inferred Session type from Better Auth.
 * Export this so web app can use the correct types matching backend config.
 */
export type Session = ReturnType<typeof getAuth>["$Infer"]["Session"]
