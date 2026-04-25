import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod/v4"

	export const env = createEnv({
	shared: {
		// Server Configuration
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},

	server: {},

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
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
		NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
		NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
	},

	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})
