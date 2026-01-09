import "reflect-metadata"

import { VersioningType } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { MainModule } from "@/app.module"

async function bootstrap() {
	const app = await NestFactory.create(MainModule, { bodyParser: false })

	// Set the global prefix for the API
	app.setGlobalPrefix("api")
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: "1",
	})

	// Create the OpenAPI document
	const openApiDoc = SwaggerModule.createDocument(
		app,
		new DocumentBuilder()
			.setTitle("API Documentation")
			.setDescription("Type-safe API with auto-generated documentation")
			.setVersion("1.0")
			.build()
	) as OpenAPIObject

	// Setup the Swagger module
	SwaggerModule.setup("api", app, cleanupOpenApiDoc(openApiDoc) as OpenAPIObject)

	// Setup the Scalar API Reference
	app.use(
		"/api/docs",
		apiReference({
			content: openApiDoc,
			theme: "none",
		})
	)

	await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(error => {
	console.error(error)
	process.exit(1)
})
