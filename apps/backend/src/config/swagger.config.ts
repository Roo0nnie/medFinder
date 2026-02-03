import { Logger, type INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { VERSION_MODULES } from "@/config/versioning.config"
import { mergeBetterAuthSchema } from "@/utils/openapi"
import { V1Module } from "@/modules/v1/v1.module"
import { HealthModule } from "@/common/health/health.module"

const logger = new Logger("SwaggerConfig")

/**
 * Create an OpenAPI document for a specific version module
 */
function createSwaggerDocument(
	app: INestApplication,
	version: string
): OpenAPIObject {
	return SwaggerModule.createDocument(
		app,
		new DocumentBuilder()
			.setTitle(`API Documentation ${version}`)
			.setDescription(`Type-safe API with auto-generated documentation for version ${version}`)
			.setVersion(version)
			.build(),
		{
			include: [
				V1Module,
				HealthModule,
			],
		}
	) as OpenAPIObject
}

/**
 * Set up Swagger and Scalar documentation for a specific version
 */
async function setupVersionedDocs(app: INestApplication, version: string): Promise<void> {
	const versionModule = VERSION_MODULES[version]
	if (!versionModule) {
		logger.warn(`No module found for version ${version}`)
		return
	}

	try {
		const baseOpenApiDoc = createSwaggerDocument(app, version)
		const mergedOpenApiDoc = await mergeBetterAuthSchema(baseOpenApiDoc)
		const swaggerPath = `api/${version}`

		SwaggerModule.setup(swaggerPath, app, cleanupOpenApiDoc(mergedOpenApiDoc) as OpenAPIObject)

		app.use(`/${swaggerPath}/docs`, apiReference({ content: mergedOpenApiDoc, theme: "none" }))

		logger.log(`Documentation set up for version ${version} at /${swaggerPath}`)
	} catch (error) {
		logger.error(`Failed to set up documentation for version ${version}`, error)
		throw error
	}
}

/**
 * Set up documentation for all registered API versions
 */
export async function setupSwagger(app: INestApplication): Promise<void> {
	const versions = Object.keys(VERSION_MODULES).sort()

	if (versions.length === 0) {
		logger.warn("No version modules found")
		return
	}

	const versionsList = versions.join(", ")
	logger.log(`Setting up documentation for ${versions.length} version(s): ${versionsList}`)

	for (const version of versions) {
		await setupVersionedDocs(app, version)
	}
}
