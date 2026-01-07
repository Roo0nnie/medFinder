import { Module } from "@nestjs/common"

import { DBModule } from "@/common/database/database.module"

import { HealthController } from "./health.controller"
import { HealthService } from "./health.service"

@Module({
	imports: [DBModule],
	controllers: [HealthController],
	providers: [HealthService],
})
export class HealthModule {}
