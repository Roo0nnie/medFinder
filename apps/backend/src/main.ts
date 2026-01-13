import "dotenv/config"
import "reflect-metadata"

import { VersioningType } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { getAuth } from "@repo/auth"

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

	// Setup the Scalar API Reference for the main API
	app.use(
		"/api/docs",
		apiReference({
			content: openApiDoc,
			theme: "none",
		})
	)

	// Expose Better Auth OpenAPI schema as JSON
	const httpAdapter = app.getHttpAdapter()
	const httpServer = httpAdapter.getInstance()

	httpServer.get("/api/auth/open-api", async (_req: unknown, res: unknown) => {
		// Use Better Auth's built-in OpenAPI generator
		// Type cast is used because the OpenAPI helper is not yet in the public types.
		// See: https://better-auth.vercel.app/docs/plugins/open-api
		const schema = (await (getAuth().api as any).generateOpenAPISchema()) as OpenAPIObject
		;(res as { json: (body: OpenAPIObject) => void }).json(schema)
	})

	// Enable CORS
	app.enableCors({
		origin: ["http://localhost:3000", "http://localhost:3001"].filter(Boolean),
		credentials: true,
	})

	await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(error => {
	console.error(error)
	process.exit(1)
})
