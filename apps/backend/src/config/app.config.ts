import { Logger, type INestApplication } from "@nestjs/common"

import { env } from "@/config/env.config"

const logger = new Logger("AppConfig")

/**
 * Configure CORS for the application
 */
function configureCors(app: INestApplication): void {
	const origins = env.CORS_ORIGINS.split(",").map(origin => origin.trim())
	app.enableCors({ origin: origins, credentials: true })
	logger.log(`CORS enabled for origins: ${origins.join(", ")}`)
}

/**
 * Enable graceful shutdown handlers for SIGTERM and SIGINT signals
 */
function enableGracefulShutdown(app: INestApplication): void {
	const shutdown = async (signal: string): Promise<void> => {
		logger.log(`Received ${signal}, starting graceful shutdown...`)
		try {
			await app.close()
			logger.log("Application closed successfully")
			process.exit(0)
		} catch (error) {
			logger.error("Error during graceful shutdown", error)
			process.exit(1)
		}
	}

	process.on("SIGTERM", () => void shutdown("SIGTERM"))
	process.on("SIGINT", () => void shutdown("SIGINT"))
	logger.log("Graceful shutdown handlers registered")
}

/**
 * Configure all application-level settings
 * Note: Global pipes/interceptors/filters are registered via APP_* providers in app.module.ts
 */
export function configureApp(app: INestApplication): void {
	configureCors(app)
	enableGracefulShutdown(app)
}
