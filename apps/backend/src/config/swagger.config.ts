import { Logger, type INestApplication } from "@nestjs/common"
import {
	DocumentBuilder,
	SwaggerModule,
	type OpenAPIObject,
} from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { VERSION_MODULES, NEUTRAL_MODULES, getVersionModules } from "@/config/versions.config"
import { mergeBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("SwaggerConfig")

/**
 * Create an OpenAPI document for a specific version
 * Automatically includes to version module + all neutral modules
 */
function createSwaggerDocument(
	app: INestApplication,
	version: string,
	modules: any[]
): OpenAPIObject {
	return SwaggerModule.createDocument(
		app,
		new DocumentBuilder()
			.setTitle(`API Documentation ${version}`)
			.setDescription(
				`Type-safe API with auto-generated documentation for version ${version}`
			)
			.setVersion(version)
			.build(),
		{
			include: modules,
		}
	) as OpenAPIObject
}

/**
 * Set up Swagger and Scalar documentation for a specific version
 */
async function setupVersionedDocs(
	app: INestApplication,
	version: string
): Promise<void> {
	try {
		const modules = getVersionModules(version)
		const baseOpenApiDoc = createSwaggerDocument(app, version, modules)
		const mergedOpenApiDoc = await mergeBetterAuthSchema(baseOpenApiDoc)
		const swaggerPath = `api/${version}`

		SwaggerModule.setup(
			swaggerPath,
			app,
			cleanupOpenApiDoc(mergedOpenApiDoc) as OpenAPIObject
		)
		app.use(
			`/${swaggerPath}/docs`,
			apiReference({ content: mergedOpenApiDoc, theme: "none" })
		)

		logger.log(
			`Documentation set up for version ${version} at /${swaggerPath}`
		)
	} catch (error) {
		logger.error(
			`Failed to set up documentation for version ${version}`,
			error
		)
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
	logger.log(
		`Setting up documentation for ${versions.length} version(s): ${versionsList}`
	)
	logger.log(
		`Neutral modules: ${NEUTRAL_MODULES.map((m) => m.constructor.name).join(
			", "
		)}`
	)

	for (const version of versions) {
		await setupVersionedDocs(app, version)
	}
}
