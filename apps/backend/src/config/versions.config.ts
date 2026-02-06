import { Logger, VersioningType, type INestApplication, type Type } from "@nestjs/common"

import { V1Module } from "@/modules/v1/v1.module"

const logger = new Logger("VersionsConfig")

/**
 * Registered API version modules
 *
 * To add a new version:
 * 1. Create version module (e.g., src/modules/v3/v3.module.ts)
 * 2. Import it at the top of this file
 * 3. Add entry with version key (e.g., v3: V3Module)
 */
export const VERSION_MODULES: Record<string, Type<unknown>> = {
	v1: V1Module,
}

/**
 * Neutral modules included in ALL API versions
 * Used for cross-version features like health checks (if needed across versions)
 */
export const NEUTRAL_MODULES: Type<unknown>[] = []

/**
 * Get modules for a specific version (version module + neutral modules)
 */
export function getVersionModules(version: string): Type<unknown>[] {
	const versionModule = VERSION_MODULES[version]
	if (!versionModule) {
		throw new Error(`Unknown API version: ${version}`)
	}
	return [versionModule, ...NEUTRAL_MODULES]
}

/**
 * Configure URI-based API versioning (e.g., /api/v1/*, /api/v2/*)
 */
export function setupVersioning(app: INestApplication): void {
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI })
	logger.log("URI-based API versioning enabled")
}
