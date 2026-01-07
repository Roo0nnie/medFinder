import { Inject, Injectable } from "@nestjs/common"
import { sql } from "drizzle-orm"

import type { HealthCheck } from "@repo/contracts"

import { DB, type DBType } from "@/common/database/database-providers"

type HealthPayload = HealthCheck

@Injectable()
export class HealthService {
	constructor(@Inject(DB) private readonly db: DBType) {}

	async check(): Promise<HealthPayload> {
		// System information
		const now = new Date()
		const uptime = Number(process.uptime().toFixed(3))
		const version = process.env.npm_package_version ?? "0.0.0"
		const environment = process.env.NODE_ENV ?? "development"

		// Health checks
		const database = await this.checkDatabase()

		const status = database.status === "up" ? "ok" : "error"

		return {
			status,
			timestamp: now.toISOString(),
			uptime,
			version,
			environment,
			checks: {
				database,
				cache: { status: "not_configured" },
			},
		}
	}

	private async checkDatabase(): Promise<HealthPayload["checks"]["database"]> {
		try {
			await this.db.execute(sql`select 1`)
			return { status: "up" }
		} catch (error: unknown) {
			return {
				status: "down",
				message: (error as Error)?.message ?? "database check failed",
			}
		}
	}
}
