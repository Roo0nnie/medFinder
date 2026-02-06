import { Logger, type INestApplication } from "@nestjs/common"
import { OpenAPIGenerator } from "@orpc/openapi"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { apiReference } from "@scalar/nestjs-api-reference"

import { contract } from "@repo/contracts"

import { VERSION_MODULES } from "@/config/versions.config"
import { mergeBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("SwaggerConfig")

/**
 * Generate an OpenAPI document from oRPC contracts
 *
 * Uses oRPC's native OpenAPIGenerator to produce a spec directly from contracts.
 * This ensures paths, summaries, descriptions, tags, and response schemas are all
 * derived from the contract definitions — no NestJS route scanning needed.
 */
async function generateOpenAPIDocument(version: string) {
	const generator = new OpenAPIGenerator({
		schemaConverters: [new ZodToJsonSchemaConverter()],
	})

	return generator.generate(contract, {
		info: {
			title: `API Documentation ${version}`,
			description: `Type-safe API with auto-generated documentation for version ${version}`,
			version,
		},
		servers: [{ url: `/api` }],
		security: [{ cookieAuth: [] }],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "better-auth.session_token",
				},
			},
		},
	})
}

/**
 * Set up Scalar docs for a specific version
 */
async function setupVersionedDocs(app: INestApplication, version: string): Promise<void> {
	const baseDoc = await generateOpenAPIDocument(version)
	const mergedDoc = await mergeBetterAuthSchema(baseDoc, version)
	const basePath = `api/${version}`

	// Serve the OpenAPI spec as JSON
	app.getHttpAdapter().get(`/${basePath}/spec.json`, (_req: unknown, res: any) => {
		res.json(mergedDoc)
	})

	// Serve Scalar API reference
	app.use(`/${basePath}/docs`, apiReference({ url: `/${basePath}/spec.json`, theme: "none" }))

	logger.log(`Documentation available at /${basePath}/spec.json and /${basePath}/docs`)
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

	for (const version of versions) {
		await setupVersionedDocs(app, version)
	}
}
