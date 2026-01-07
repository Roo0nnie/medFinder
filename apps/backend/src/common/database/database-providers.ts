import { type InjectionToken } from "@nestjs/common"
import type { Pool } from "pg"

import type { DBClient } from "@repo/db/client"

/**
 * Injection token for the database client
 */
export const DB = Symbol("DB") as InjectionToken<DBType>

/**
 * Injection token for the PostgreSQL connection pool
 */
export const POOL = Symbol("POOL") as InjectionToken<Pool>

/**
 * Type alias for the database client
 * This is the type that should be injected in services
 */
export type DBType = DBClient
