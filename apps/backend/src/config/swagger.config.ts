import { Logger, type INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import type { PathsObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { NEUTRAL_MODULES, VERSION_MODULES } from "@/config/versions.config"
import { mergeBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("SwaggerConfig")

/**
 * Filter OpenAPI paths to only include routes for a specific version
 *
 * NestJS URI versioning creates paths like /api/v1/examples/todos
 * This filters paths to only include those matching the version prefix
 */
function filterPathsByVersion(paths: PathsObject, version: string): PathsObject {
	const versionPrefix = `/api/${version}/`
	const filtered: PathsObject = {}

	for (const [path, pathItem] of Object.entries(paths)) {
		if (path.startsWith(versionPrefix)) {
			filtered[path] = pathItem
		}
	}

	return filtered
}

/**
 * Create an OpenAPI document for a specific version
 *
 * Scans ALL modules but filters paths to only include the target version.
 * This approach works better than `include` option with nested module hierarchies.
 */
function createSwaggerDocument(app: INestApplication, version: string): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle(`API Documentation ${version}`)
		.setDescription(`Type-safe API with auto-generated documentation for version ${version}`)
		.setVersion(version)
		.build()

	const fullDoc = SwaggerModule.createDocument(app, config) as OpenAPIObject

	return {
		...fullDoc,
		paths: filterPathsByVersion(fullDoc.paths ?? {}, version),
	}
}

/**
 * Set up Swagger UI and Scalar docs for a specific version
 */
async function setupVersionedDocs(app: INestApplication, version: string): Promise<void> {
	const baseDoc = createSwaggerDocument(app, version)
	const mergedDoc = await mergeBetterAuthSchema(baseDoc, version)
	const basePath = `api/${version}`

	SwaggerModule.setup(basePath, app, cleanupOpenApiDoc(mergedDoc) as OpenAPIObject)
	app.use(`/${basePath}/docs`, apiReference({ content: mergedDoc, theme: "none" }))

	logger.log(`Documentation available at /${basePath} and /${basePath}/docs`)
}

/**
 * Set up documentation for all registered API versions
 */
export async function setupSwagger(app: INestApplication): Promise<void> {
	const versions = Object.keys(VERSION_MODULES).sort()

	if (versions.length === 0) {
		logger.warn("No version modules found, skipping documentation setup")
		return
	}

	logger.log(`Setting up documentation for versions: ${versions.join(", ")}`)

	if (NEUTRAL_MODULES.length > 0) {
		logger.log(`Neutral modules: ${NEUTRAL_MODULES.map(m => m.name).join(", ")}`)
	}

	for (const version of versions) {
		await setupVersionedDocs(app, version)
	}
}
