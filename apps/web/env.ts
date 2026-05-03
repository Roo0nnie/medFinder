import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod/v4"

export const env = createEnv({
	shared: {
		// Server Configuration
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},

	server: {
		/** Django origin (no trailing slash). Enables same-origin cookie auth via next.config rewrites. */
		BACKEND_PROXY_URL: z
			.string()
			.url()
			.optional()
			.superRefine((val, ctx) => {
				if (process.env.VERCEL === "1" && !val?.trim()) {
					ctx.addIssue({
						code: "custom",
						message:
							"BACKEND_PROXY_URL is required on Vercel (your Django API origin, e.g. https://your-api.onrender.com). Without it, /api/v1/* is not rewritten and returns 404.",
					})
				}
			}),
		VERCEL_BRANCH_URL: z.string().optional(),
		VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
		VERCEL_URL: z.string().optional(),
	},

	client: {
		// Public URLs
		NEXT_PUBLIC_APP_URL: z.url(),
		NEXT_PUBLIC_API_BASE_URL: z.url(),
		NEXT_PUBLIC_API_VERSION: z.string(),
		NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional().default(""),
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional().default(""),
	},

	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		BACKEND_PROXY_URL: process.env.BACKEND_PROXY_URL,
		VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
		VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
		VERCEL_URL: process.env.VERCEL_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
		NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
		NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
	},

	// Vercel sets CI=1; still validate so missing BACKEND_PROXY_URL fails the build instead of shipping broken rewrites.
	skipValidation:
		process.env.npm_lifecycle_event === "lint" ||
		(process.env.CI === "true" && process.env.VERCEL !== "1"),
})
