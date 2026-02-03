import { Logger, ValidationPipe, type INestApplication } from "@nestjs/common"

import { env } from "@/config/env.config"

const logger = new Logger("AppConfig")

/**
 * Configure CORS for the application
 */
export function configureCors(app: INestApplication): void {
	app.enableCors({
		origin: env.CORS_ORIGINS.split(","),
		credentials: true,
	})
	logger.log("CORS enabled")
}

/**
 * Configure global validation pipes for request validation
 */
export function configureGlobalPipes(app: INestApplication): void {
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	)
	logger.log("Global validation pipe configured")
}

/**
 * Enable graceful shutdown handlers for SIGTERM and SIGINT signals
 */
export function enableGracefulShutdown(app: INestApplication): void {
	const gracefulShutdown = async (signal: string): Promise<void> => {
		logger.log(`Received ${signal}. Starting graceful shutdown...`)

		try {
			await app.close()
			logger.log("Application closed successfully")
			process.exit(0)
		} catch (error) {
			logger.error("Error during graceful shutdown", error)
			process.exit(1)
		}
	}

	process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"))
	process.on("SIGINT", () => void gracefulShutdown("SIGINT"))

	logger.log("Graceful shutdown enabled")
}

/**
 * Configure all application-level settings
 */
export function configureApp(app: INestApplication): void {
	configureCors(app)
	configureGlobalPipes(app)
	enableGracefulShutdown(app)
}
