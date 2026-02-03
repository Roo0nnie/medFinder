import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { HealthCheckDto } from "@repo/contracts"

import { HealthService } from "./health.service"

@ApiTags("Health")
@Controller({ path: "health", version: "1" })
export class HealthController {
	constructor(private readonly service: HealthService) {}

	@Get()
	@AllowAnonymous()
	@ApiOperation({ summary: "Health check" })
	@ApiResponse({
		status: 200,
		description: "Health check passed",
		type: HealthCheckDto,
	})
	async check() {
		return this.service.check()
	}
}
