import "dotenv/config"
import "reflect-metadata"

import { VersioningType } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { toNodeHandler } from "better-auth/node"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { getAuth } from "@repo/auth"

import { MainModule } from "@/app.module"
import { generateBetterAuthSchema, mergeBetterAuthSchema } from "@/utils/openapi"

async function bootstrap() {
	const app = await NestFactory.create(MainModule, { bodyParser: false })

	// Enable CORS first (before any routes are registered)
	app.enableCors({
		origin: ["http://localhost:3000", "http://localhost:3001"],
		credentials: true,
	})

	// Configure API prefix and versioning
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" })

	// Create base OpenAPI document and merge Better Auth schema
	const baseOpenApiDoc = SwaggerModule.createDocument(
		app,
		new DocumentBuilder()
			.setTitle("API Documentation")
			.setDescription("Type-safe API with auto-generated documentation")
			.setVersion("1.0")
			.build()
	) as OpenAPIObject

	const mergedOpenApiDoc = await mergeBetterAuthSchema(baseOpenApiDoc)

	// Setup Swagger and Scalar API documentation
	SwaggerModule.setup("api", app, cleanupOpenApiDoc(mergedOpenApiDoc) as OpenAPIObject)
	app.use("/api/docs", apiReference({ content: mergedOpenApiDoc, theme: "none" }))

	// Register Better Auth routes on the Express instance
	const httpServer = app.getHttpAdapter().getInstance()
	httpServer.all("/api/auth/*splat", toNodeHandler(getAuth()))
	httpServer.get(
		"/api/auth/open-api",
		async (_: unknown, res: { json: (body: OpenAPIObject) => void }) => {
			res.json(await generateBetterAuthSchema())
		}
	)

	await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(error => {
	console.error(error)
	process.exit(1)
})
