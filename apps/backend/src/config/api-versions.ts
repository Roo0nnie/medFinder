import { Logger, VersioningType, type INestApplication } from "@nestjs/common"

import { v1Contract } from "@repo/contracts"

const logger = new Logger("ApiVersions")

// ── Versioned Contracts ──────────────────────────────────────────────
// Imported by controllers: @Implement(v1.todo.list)

export { v1Contract as v1 }

// Future versions:
// export { v2Contract as v2 } from "@repo/contracts"

// ── Version Registry ─────────────────────────────────────────────────
// Used by swagger, auth config, and bootstrap

export const API_VERSIONS = {
	v1: { contract: v1Contract },
	// v2: { contract: v2Contract },
} as const

export type VersionKey = keyof typeof API_VERSIONS

/**
 * Get all registered version keys (e.g., ["v1", "v2"])
 */
export function getVersionKeys(): VersionKey[] {
	return Object.keys(API_VERSIONS) as VersionKey[]
}

/**
 * Get the versioned contract for a specific version
 */
export function getVersionContract(version: string) {
	return API_VERSIONS[version as VersionKey]?.contract
}

// ── Versioning Setup ─────────────────────────────────────────────────

/**
 * Configure URI-based API versioning (e.g., /api/v1/*, /api/v2/*)
 */
export function setupVersioning(app: INestApplication): void {
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI })
	logger.log("URI-based API versioning enabled")
}
