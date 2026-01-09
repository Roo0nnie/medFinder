import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { schema } from "./schema.js"

/**
 * Type for the Drizzle database client
 */
export type DBClient = NodePgDatabase<typeof schema>

/**
 * Creates a PostgreSQL connection pool
 *
 * @param connectionString - Optional connection string. If not provided, uses POSTGRES_URL environment variable
 * @returns A PostgreSQL connection pool
 * @throws Error if connection string is not provided and POSTGRES_URL is not set
 */
export function createPool(connectionString?: string): Pool {
	const connString = connectionString ?? process.env.POSTGRES_URL
	if (!connString) {
		throw new Error("POSTGRES_URL environment variable is not set")
	}
	return new Pool({ connectionString: connString })
}

/**
 * Creates a Drizzle ORM client with the configured schema
 *
 * @param connectionString - Optional connection string. If not provided, uses POSTGRES_URL environment variable
 * @returns A Drizzle database client
 * @throws Error if connection string is not provided and POSTGRES_URL is not set
 */
export function createDBClient(connectionString?: string): DBClient {
	const pool = createPool(connectionString)
	// @ts-expect-error - Drizzle beta types may not correctly infer Pool overload
	return drizzle(pool, { schema })
}

/**
 * Creates a Drizzle ORM client from an existing pool
 *
 * @param pool - PostgreSQL connection pool
 * @returns A Drizzle database client
 */
export function createDBClientFromPool(pool: Pool): DBClient {
	// @ts-expect-error - Drizzle beta types may not correctly infer Pool overload
	return drizzle(pool, { schema })
}
