import { Module } from "@nestjs/common"

import { ExamplesModule } from "./examples/examples.module"
import { HealthModule } from "./health/health.module"

@Module({
	imports: [ExamplesModule, HealthModule],
})
export class V2Module {}
