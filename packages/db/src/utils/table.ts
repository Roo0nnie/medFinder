import { pgTableCreator } from "drizzle-orm/pg-core"

const baseCreateTable = pgTableCreator(name => name)

/** Every app table uses RLS in Postgres (e.g. Supabase); wire it in schema so `drizzle-kit push` does not disable it. */
export const createTable = ((...args: [unknown, unknown, unknown?]) =>
	(baseCreateTable as (...a: unknown[]) => { enableRLS(): unknown })(...args).enableRLS()) as typeof baseCreateTable
