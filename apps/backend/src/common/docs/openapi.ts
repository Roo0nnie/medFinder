import type { INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

export function setupOpenApi(app: INestApplication): void {
	const swaggerConfig = new DocumentBuilder()
		.setTitle("API Documentation")
		.setDescription("Type-safe API with auto-generated documentation")
		.setVersion("1.0")
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)

	const cleanedDocument = cleanupOpenApiDoc(document)

	app.use(
		"/api/docs",
		apiReference({
			content: cleanedDocument,
			theme: "none",
		})
	)
}
