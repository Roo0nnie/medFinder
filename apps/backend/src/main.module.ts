import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "@thallesp/nestjs-better-auth"

import { auth } from "@repo/auth"

import { DBModule } from "@/common/database/database.module"
import { HealthModule } from "@/common/health/health.module"
import { AppModule as V1AppModule } from "@/modules/v1/app.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env",
		}),
		DBModule,
		HealthModule,
		AuthModule.forRoot({ auth }), // Better Auth integration
		V1AppModule,
	],
})
export class AppModule {}
