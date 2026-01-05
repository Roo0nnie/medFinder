import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common"
import { HealthCheck, HealthCheckService } from "@nestjs/terminus"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { HealthService } from "./health.service"

@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly service: HealthService
	) {}

	@Get()
	@AllowAnonymous()
	@HealthCheck()
	async check() {
		await this.health.check([])
		return this.service.check()
	}
}
