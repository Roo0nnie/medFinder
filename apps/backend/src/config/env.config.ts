import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

/**
 * Type-safe environment variable validation for Backend API
 *
 * Validates environment variables at module load time (fail-fast).
 * All environment variables should be accessed through this `env` object.
 *
 * The app supports multiple API versions simultaneously (see versions.config.ts).
 */
export const env = createEnv({
	/**
	 * Server-side environment variables
	 * These are only available on server and will NOT be exposed to client
	 */
	server: {
		// Server Configuration
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().int().positive().default(3000),
		CORS_ORIGINS: z.string(),

		// Database
		DATABASE_URL: z.string(),

		// Authentication (Better Auth)
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_TRUSTED_ORIGINS: z.string(),

		// OAuth Providers (Google)
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
	},

	/**
	 * Pass process.env directly for runtime validation
	 */
	runtimeEnv: process.env,

	/**
	 * Skip validation during CI or linting to prevent errors in non-build contexts
	 */
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})

export type Env = typeof env
