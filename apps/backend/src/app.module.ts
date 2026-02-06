import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER } from "@nestjs/core"
import { AuthModule } from "@thallesp/nestjs-better-auth"

import { getAuth } from "@repo/auth"

import { HttpExceptionFilter } from "@/common/filters/http-exception.filter"
import { V1Module } from "@/modules/v1/v1.module"

import { env } from "./config/env.config"

@Module({
	imports: [
		// Core configuration
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env",
			load: [() => env],
		}),
		// Authentication (controllers disabled - we register versioned routes in setupBetterAuth)
		AuthModule.forRoot({ auth: getAuth(), disableControllers: true }),
		// Versioned modules
		V1Module,
	],
	providers: [
		// Global providers
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class MainModule {}
