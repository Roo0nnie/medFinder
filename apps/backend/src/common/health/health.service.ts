import { Injectable } from "@nestjs/common"
import { HealthCheckService } from "@nestjs/terminus"

import type { HealthCheck } from "@repo/contracts"

import { DBHealthIndicator } from "./indicators/db.health"

type HealthPayload = HealthCheck

@Injectable()
export class HealthService {
	constructor(
		private readonly health: HealthCheckService,
		private readonly dbIndicator: DBHealthIndicator
	) {}

	async check(): Promise<HealthPayload> {
		const now = new Date()
		const uptime = Number(process.uptime().toFixed(3))
		const version = process.env.npm_package_version ?? "0.0.0"
		const environment = process.env.NODE_ENV ?? "development"

		const dbResult = await this.runDbCheck()

		return {
			status: dbResult.status,
			timestamp: now.toISOString(),
			uptime,
			version,
			environment,
			checks: {
				database: dbResult.database,
				cache: { status: "not_configured" },
			},
		}
	}

	private async runDbCheck(): Promise<{
		status: HealthPayload["status"]
		database: HealthPayload["checks"]["database"]
	}> {
		try {
			const result = await this.health.check([() => this.dbIndicator.pingCheck("database")])
			const database = result.info?.database ??
				result.details?.database ??
				(result as unknown as Record<string, { status?: string; message?: string }>).database ?? {
					status: result.status,
				}
			return {
				status: result.status as HealthPayload["status"],
				database: database as HealthPayload["checks"]["database"],
			}
		} catch (error: unknown) {
			const database = {
				status: "down",
				message: (error as Error)?.message ?? "database check failed",
			}
			return {
				status: "error",
				database: database as HealthPayload["checks"]["database"],
			}
		}
	}
}
