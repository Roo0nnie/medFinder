import { Logger, VersioningType, type INestApplication } from "@nestjs/common"

import { env } from "@/config/env.config"
import { V1Module } from "@/modules/v1/v1.module"

const logger = new Logger("VersioningConfig")

/**
 * Registered API version modules
 */
export const VERSION_MODULES: Record<string, unknown> = {
	v1: V1Module,
}

/**
 * Discover available API versions
 */
export function discoverVersions(): string[] {
	return Object.keys(VERSION_MODULES).sort()
}

/**
 * Configure API versioning with URI-based versioning
 */
export function setupVersioning(app: INestApplication): void {
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: env.API_VERSION })
	logger.log(`API versioning enabled with default version: ${env.API_VERSION}`)
}
