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

	// Merge Better Auth OpenAPI schema into the main OpenAPI document
	let mergedOpenApiDoc: OpenAPIObject = openApiDoc

	try {
		const betterAuthSchema = (await (getAuth().api as any).generateOpenAPISchema()) as OpenAPIObject
		const oldTag = "Default"
		const newTag = "Auth"

		betterAuthSchema.tags = betterAuthSchema.tags?.map(tag =>
			tag.name === oldTag ? { ...tag, name: newTag } : tag
		) ?? [{ name: newTag, description: "Authentication endpoints" }]

		for (const path of Object.values(betterAuthSchema.paths ?? {})) {
			for (const op of Object.values(path ?? {})) {
				if (!op || !("tags" in op) || !Array.isArray((op as any).tags)) continue
				;(op as any).tags = (op as any).tags.map((t: string) => (t === oldTag ? newTag : t))
			}
		}
		mergedOpenApiDoc = {
			...openApiDoc,
			paths: {
				...(openApiDoc.paths ?? {}),
				...(betterAuthSchema.paths ?? {}),
			},
			tags: [...(openApiDoc.tags ?? []), ...(betterAuthSchema.tags ?? [])],
			components: {
				...(openApiDoc.components ?? {}),
				...(betterAuthSchema.components ?? {}),
				schemas: {
					...(openApiDoc.components?.schemas ?? {}),
					...(betterAuthSchema.components?.schemas ?? {}),
				},
				securitySchemes: {
					...(openApiDoc.components?.securitySchemes ?? {}),
					...(betterAuthSchema.components?.securitySchemes ?? {}),
				},
			},
		}
	} catch (error) {
		console.error("Failed to merge Better Auth OpenAPI schema", error)
	}

	// Setup the Swagger module
	SwaggerModule.setup("api", app, cleanupOpenApiDoc(mergedOpenApiDoc) as OpenAPIObject)

	// Setup the Scalar API Reference for the main API
	app.use(
		"/api/docs",
		apiReference({
			content: mergedOpenApiDoc,
			theme: "none",
		})
	)

	// Get the underlying Express instance for custom route registration
	const httpAdapter = app.getHttpAdapter()
	const httpServer = httpAdapter.getInstance()

	// Register Better Auth handler to catch all /api/auth/* requests
	// This is needed because @thallesp/nestjs-better-auth's route registration
	// doesn't properly intercept requests despite initialization logs
	httpServer.all("/api/auth/*splat", toNodeHandler(getAuth()))

	// Expose Better Auth OpenAPI schema as JSON
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
