import "reflect-metadata"

import { VersioningType, type PipeTransform } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod"

import { registerSchemasInOpenAPI, schemaMap } from "@repo/contracts"

import { AppModule } from "@/main.module"

// Patch NestJS Swagger to work with Zod schemas (required for v4.0.1)
patchNestJsSwagger()

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// Disable body parser to allow Better Auth to handle raw request body
		// The library will automatically re-add the default body parsers
		bodyParser: false,
	})
	app.setGlobalPrefix("api")
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: "1",
	})
	app.useGlobalPipes(new ZodValidationPipe() as PipeTransform)

	// Configure OpenAPI documentation
	const swaggerConfig = new DocumentBuilder()
		.setTitle("API Documentation")
		.setDescription("Type-safe API with auto-generated documentation")
		.setVersion("1.0")
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)

	// Automatically register all Zod schemas from contracts package
	registerSchemasInOpenAPI(document, schemaMap)

	// Use Scalar API Reference instead of default Swagger UI
	app.use(
		"/api/docs",
		apiReference({
			content: document,
			theme: "none",
		})
	)

	await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(error => {
	console.error(error)
	process.exit(1)
})
