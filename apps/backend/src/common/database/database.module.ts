import { Global, Module } from "@nestjs/common"
import { drizzle } from "drizzle-orm/node-postgres"

import { schema } from "@repo/db/schema"

import { DB, type DBType } from "./database-providers"

/**
 * Global NestJS module that provides Drizzle ORM database client.
 *
 * This module should be imported once in your root AppModule.
 * It provides:
 * - DB: The Drizzle database client (injectable)
 *
 * Drizzle manages its own connection pool internally.
 *
 * Requires DATABASE_URL environment variable to be set.
 *
 * @example
 * ```typescript
 * import { DatabaseModule } from "./database/database.module"
 *
 * @Module({
 *   imports: [DatabaseModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
	providers: [
		{
			provide: DB,
			useFactory: (): DBType => {
				const connectionString = process.env.DATABASE_URL
				if (!connectionString) {
					throw new Error("DATABASE_URL environment variable is required when using DatabaseModule")
				}
				return drizzle(connectionString, { schema })
			},
		},
	],
	exports: [DB],
})
export class DBModule {}
