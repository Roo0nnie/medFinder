import { Logger, type INestApplication, type Type } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { getVersionModules, NEUTRAL_MODULES, VERSION_MODULES } from "@/config/versions.config"
import { mergeBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("SwaggerConfig")

/**
 * Create an OpenAPI document for a specific version
 */
function createSwaggerDocument(
	app: INestApplication,
	version: string,
	modules: Type<unknown>[]
): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle(`API Documentation ${version}`)
		.setDescription(`Type-safe API with auto-generated documentation for version ${version}`)
		.setVersion(version)
		.build()

	return SwaggerModule.createDocument(app, config, { include: modules }) as OpenAPIObject
}

/**
 * Set up Swagger UI and Scalar docs for a specific version
 */
async function setupVersionedDocs(app: INestApplication, version: string): Promise<void> {
	const modules = getVersionModules(version)
	const baseDoc = createSwaggerDocument(app, version, modules)
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
