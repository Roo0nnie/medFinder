import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod/v4"

// import { vercel } from "@t3-oss/env-nextjs/presets-zod";
// import { authEnv } from "@repo/auth/env";

export const env = createEnv({
	// extends: [authEnv(), vercel()],
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},
	/**
	 * Specify your server-side environment variables schema here.
	 * This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		BETTER_AUTH_SECRET: z.string().optional(),
		AUTH_SECRET: z.string().optional(),
		BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
		VERCEL_URL: z.string().optional(),
		// POSTGRES_URL: z.url(),
	},

	/**
	 * Specify your client-side environment variables schema here.
	 * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BETTER_AUTH_URL: z.url().optional(),
	},
	/**
	 * Destructure all  client variables from `process.env` to make sure they aren't tree-shaken away.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		AUTH_SECRET: process.env.AUTH_SECRET,
		BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
		VERCEL_URL: process.env.VERCEL_URL,
	},
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})
