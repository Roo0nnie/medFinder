import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { AuthModule } from "@thallesp/nestjs-better-auth"
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod"

import { getAuth } from "@repo/auth"

import { HttpExceptionFilter } from "@/common/filters/http-exception.filter"
import { ResponseWrapperInterceptor } from "@/common/interceptors/response-wrapper.interceptor"
import { V1Module } from "@/modules/v1/v1.module"
import { V2Module } from "@/modules/v2/v2.module"

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
		V2Module,
	],
	providers: [
		// Global providers
		{
			provide: APP_PIPE,
			useClass: ZodValidationPipe,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseWrapperInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ZodSerializerInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class MainModule {}
