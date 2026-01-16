import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

/**
 * Type-safe environment variable validation using T3 Env
 *
 * Validates environment variables at module load time (fail-fast).
 * All environment variables should be accessed through this `env` object.
 */
export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here.
	 * This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		DATABASE_URL: z.string().url(),
		PORT: z.coerce.number().int().positive().default(3000),
		BETTER_AUTH_URL: z.string().url().optional(),
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
	},
	/**
	 * Pass process.env directly for runtime validation
	 */
	runtimeEnv: process.env,
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})

export type Env = typeof env
