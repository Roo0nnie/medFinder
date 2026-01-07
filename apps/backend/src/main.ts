import "reflect-metadata"

import { VersioningType, type PipeTransform } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod"

import { schemaMap } from "@repo/contracts"

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

	// Register Zod schemas as OpenAPI schemas
	// Helper to convert Zod schema to OpenAPI format
	const convertSchemaToOpenAPI = (schema: any) => {
		const schemaDef = schema._def

		// Handle object schemas with date fields
		if (schemaDef?.shape && typeof schemaDef.shape === "object") {
			const shape = schemaDef.shape
			const properties: any = {}
			const required: string[] = []

			// Check if any field is a date
			const hasDateFields = Object.keys(shape).some(key => {
				const fieldDef = shape[key]?._def
				return (
					fieldDef?.type === "date" ||
					(fieldDef?.type === "optional" && fieldDef.innerType?._def?.type === "date") ||
					(fieldDef?.type === "default" && fieldDef.innerType?._def?.type === "date")
				)
			})

			if (hasDateFields) {
				for (const [key, value] of Object.entries(shape)) {
					const fieldSchema = value as any
					const fieldDef = fieldSchema?._def
					const isOptional = fieldDef?.type === "optional" || fieldDef?.type === "default"

					// Handle date fields
					if (
						fieldDef?.type === "date" ||
						(fieldDef?.type === "optional" && fieldDef.innerType?._def?.type === "date") ||
						(fieldDef?.type === "default" && fieldDef.innerType?._def?.type === "date")
					) {
						properties[key] = { type: "string", format: "date-time" }
						if (!isOptional) required.push(key)
					} else {
						// Convert other fields
						try {
							const fieldJsonSchema = fieldSchema.toJSONSchema()
							properties[key] = fieldJsonSchema
							if (!isOptional && fieldJsonSchema.type) {
								required.push(key)
							}
						} catch {
							// Skip fields that can't be converted
						}
					}
				}

				return {
					type: "object",
					properties,
					...(required.length > 0 && { required }),
					additionalProperties: false,
				}
			}
		}

		// Use normal conversion for schemas without dates
		try {
			return schema.toJSONSchema()
		} catch {
			return {}
		}
	}

	// Ensure components.schemas exists
	if (!document.components) {
		document.components = {}
	}
	if (!document.components.schemas) {
		document.components.schemas = {}
	}

	// Automatically register all schemas from schemaMap
	for (const [dtoName, schema] of Object.entries(schemaMap)) {
		const openApiSchema = convertSchemaToOpenAPI(schema)
		// Remove $schema property if present
		const { $schema: _, ...cleanSchema } = openApiSchema
		document.components.schemas[dtoName] = cleanSchema
	}

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
