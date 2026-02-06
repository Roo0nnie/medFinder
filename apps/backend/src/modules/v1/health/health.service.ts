import { Injectable } from "@nestjs/common"
import { sql } from "drizzle-orm"

import type { HealthCheck } from "@repo/contracts"

import { db } from "@/common/database/database.client"
import { env } from "@/config/env.config"

@Injectable()
export class HealthService {
	async check(): Promise<HealthCheck> {
		// System information
		const now = new Date()
		const uptime = Number(process.uptime().toFixed(3))
		const version = process.env.npm_package_version ?? "0.0.0"
		const environment = env.NODE_ENV

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

	private async checkDatabase(): Promise<HealthCheck["checks"]["database"]> {
		try {
			await db.execute(sql`select 1`)
			return { status: "up" }
		} catch (error: unknown) {
			return {
				status: "down",
				message: (error as Error)?.message ?? "database check failed",
			}
		}
	}
}
