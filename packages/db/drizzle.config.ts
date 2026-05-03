/// <reference types="node" />
import "dotenv/config"

import { defineConfig } from "drizzle-kit"

/** Public tables owned by this package (`createTable("…")` names). Used by `tablesFilter` below. */
const appTableNames = [
	"accounts",
	"audit_events",
	"brands",
	"deletion_requests",
	"medical_products",
	"medical_product_variants",
	"owner_brands",
	"pharmacies",
	"pharmacy_inventory",
	"pharmacy_reviews",
	"pharmacy_staff",
	"product_categories",
	"product_page_engagements",
	"product_reservations",
	"product_reviews",
	"product_search_selections",
	"product_searches",
	"sessions",
	"staff",
	"users",
	"verifications",
] as const

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./src/migrations",
	dialect: "postgresql",
	// Supabase (and similar) expose many schemas (auth, realtime, storage, …).
	// Without this, `drizzle-kit push` treats them as "extra" and plans destructive drops.
	schemaFilter: ["public"],
	// Restrict introspection to our tables so unrelated rows in `public` (e.g. Django `auth_*`,
	// `django_*`) are not used as rename candidates and are not dropped.
	tablesFilter: [...appTableNames],
	// Do not set `entities.roles` here: with an object like `{ provider: "supabase" }` the kit
	// still introspects other DB roles (e.g. PostgreSQL's `pg_checkpoint`) and may emit
	// `DROP ROLE`, which fails on Supabase/pooler. Omit roles so push never manages roles.
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
})
