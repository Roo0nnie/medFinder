/// <reference types="node" />
import "dotenv/config"

import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./src/migrations",
	dialect: "postgresql",
	// Supabase (and similar) expose many schemas (auth, realtime, storage, …).
	// Without this, `drizzle-kit push` treats them as "extra" and plans destructive drops.
	schemaFilter: ["public"],
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
})
