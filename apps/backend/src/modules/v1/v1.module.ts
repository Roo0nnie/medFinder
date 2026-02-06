import { Module } from "@nestjs/common"

import { ORPCCommonModule } from "@/common/orpc/orpc.module"

import { ExamplesModule } from "./examples/examples.module"
import { HealthModule } from "./health/health.module"

@Module({
	imports: [ExamplesModule, HealthModule, ORPCCommonModule],
})
export class V1Module {}
