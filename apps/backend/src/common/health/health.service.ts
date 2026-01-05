import { Injectable } from "@nestjs/common"
import { HealthCheckService } from "@nestjs/terminus"

import { DBHealthIndicator } from "./indicators/db.health"

type HealthChecks = {
	database: { status: string; message?: string } & Record<string, unknown>
	cache: { status: string; message?: string }
}

type HealthPayload = {
	status: string
	timestamp: string
	uptime: number
	checks: HealthChecks
}

@Injectable()
export class HealthService {
	constructor(
		private readonly health: HealthCheckService,
		private readonly dbIndicator: DBHealthIndicator
	) {}

	async check(): Promise<HealthPayload> {
		const now = new Date()
		const uptime = Number(process.uptime().toFixed(3))

		const dbResult = await this.runDbCheck()

		return {
			status: dbResult.status,
			timestamp: now.toISOString(),
			uptime,
			checks: {
				database: dbResult.database,
				cache: { status: "not_configured" },
			},
		}
	}

	private async runDbCheck(): Promise<{
		status: string
		database: { status: string; message?: string } & Record<string, unknown>
	}> {
		try {
			const result = await this.health.check([() => this.dbIndicator.pingCheck("database")])
			const database = result.info?.database ??
				result.details?.database ??
				(result as unknown as Record<string, { status?: string; message?: string }>).database ?? {
					status: result.status,
				}
			return {
				status: result.status,
				database: database as { status: string; message?: string } & Record<string, unknown>,
			}
		} catch (error: unknown) {
			const database = {
				status: "down",
				message: (error as Error)?.message ?? "database check failed",
			}
			return {
				status: "error",
				database: database as { status: string; message?: string } & Record<string, unknown>,
			}
		}
	}
}
