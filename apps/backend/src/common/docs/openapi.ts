import type { INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"

import { registerSchemasInOpenAPI, schemaMap } from "@repo/contracts"

export function setupOpenApi(app: INestApplication): void {
	const swaggerConfig = new DocumentBuilder()
		.setTitle("API Documentation")
		.setDescription("Type-safe API with auto-generated documentation")
		.setVersion("1.0")
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)

	registerSchemasInOpenAPI(document, schemaMap)

	app.use(
		"/api/docs",
		apiReference({
			content: document,
			theme: "none",
		})
	)
}
