import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { HealthCheck, HealthCheckService } from "@nestjs/terminus"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { HealthCheckDto } from "@repo/contracts"

import { HealthService } from "./health.service"

@ApiTags("Health")
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly service: HealthService
	) {}

	@Get()
	@AllowAnonymous()
	@ApiOperation({ summary: "Health check" })
	@ApiResponse({
		status: 200,
		description: "Health check passed",
		type: HealthCheckDto,
	})
	@HealthCheck()
	async check() {
		await this.health.check([])
		return this.service.check()
	}
}
