import { Logger, VersioningType, type INestApplication, type Type } from "@nestjs/common"

import { HealthModule } from "@/common/health/health.module"
import { V1Module } from "@/modules/v1/v1.module"
import { V2Module } from "@/modules/v2/v2.module"

const logger = new Logger("VersionsConfig")

/**
 * Registered API version modules
 * To add a new version:
 * 1. Create version module (e.g., src/modules/v2/v2.module.ts)
 * 2. Import it at the top of this file
 * 3. Add it to this object with a version key
 */
export const VERSION_MODULES: Record<string, Type<any>> = {
	v1: V1Module,
	v2: V2Module,
}

/**
 * Neutral modules - modules that appear across ALL API versions
 * These are automatically included in every version's OpenAPI documentation
 * Examples: HealthModule, AuthModule
 */
export const NEUTRAL_MODULES: Type<any>[] = [HealthModule]

/**
 * Discover available API versions
 */
export function discoverVersions(): string[] {
	return Object.keys(VERSION_MODULES).sort()
}

/**
 * Get all modules for a specific version (version + neutral modules)
 */
export function getVersionModules(version: string): Type<any>[] {
	const versionModule = VERSION_MODULES[version]
	if (!versionModule) {
		throw new Error(`No module found for version ${version}`)
	}
	return [versionModule, ...NEUTRAL_MODULES]
}

/**
 * Configure API versioning with URI-based versioning
 * No default version - all versions must be explicitly requested
 */
export function setupVersioning(app: INestApplication): void {
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI })
	logger.log("API versioning enabled with URI-based versioning")
}
