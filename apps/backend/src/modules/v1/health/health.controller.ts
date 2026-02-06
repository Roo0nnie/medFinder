import { Controller } from "@nestjs/common"
import { Implement } from "@orpc/nest"
import { implement } from "@orpc/server"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { contract } from "@repo/contracts"

import { HealthService } from "./health.service"

@Controller()
export class HealthController {
	constructor(private readonly service: HealthService) {}

	@AllowAnonymous()
	@Implement(contract.health.check)
	async check() {
		return implement(contract.health.check).handler(async () => {
			return this.service.check()
		})
	}
}
