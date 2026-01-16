/// <reference types="node" />
import "dotenv/config"

import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.POSTGRES_URL || "",
	},
})
