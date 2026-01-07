import type { z } from "zod"

// Type for OpenAPI schema object
type OpenAPISchema = Record<string, unknown>

// Type for accessing Zod's internal _def structure
type ZodDef = {
	type?: string
	shape?: Record<string, z.ZodTypeAny>
	innerType?: { _def?: ZodDef }
} & Record<string, unknown>

/**
 * Convert Zod schema to OpenAPI format
 * Handles date fields which Zod v4's toJSONSchema() doesn't support
 */
export function zodToOpenAPISchema(schema: z.ZodTypeAny): OpenAPISchema {
	// Access internal Zod definition (not part of public API but needed for date detection)
	const schemaDef = (schema as unknown as { _def?: ZodDef })._def

	// Handle object schemas with date fields
	if (schemaDef?.shape && typeof schemaDef.shape === "object") {
		const shape = schemaDef.shape
		const properties: Record<string, OpenAPISchema> = {}
		const required: string[] = []

		// Check if any field is a date
		const hasDateFields = Object.keys(shape).some(key => {
			const fieldDef = (shape[key] as unknown as { _def?: ZodDef })?._def
			return (
				fieldDef?.type === "date" ||
				(fieldDef?.type === "optional" && fieldDef.innerType?._def?.type === "date") ||
				(fieldDef?.type === "default" && fieldDef.innerType?._def?.type === "date")
			)
		})

		if (hasDateFields) {
			for (const [key, value] of Object.entries(shape)) {
				const fieldSchema = value as z.ZodTypeAny
				const fieldDef = (fieldSchema as unknown as { _def?: ZodDef })?._def
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
						const fieldJsonSchema = (fieldSchema as z.ZodTypeAny).toJSONSchema()
						properties[key] = fieldJsonSchema
						if (!isOptional && (fieldJsonSchema as { type?: unknown }).type) {
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
		return (schema as z.ZodTypeAny).toJSONSchema()
	} catch {
		return {}
	}
}

/**
 * Register Zod schemas in OpenAPI document
 * @param document - OpenAPI document object
 * @param schemaMap - Map of DTO names to Zod schemas
 */
export function registerSchemasInOpenAPI(
	document: { components?: { schemas?: Record<string, unknown> } },
	schemaMap: Record<string, z.ZodTypeAny>
): void {
	if (!document.components) {
		document.components = {}
	}
	if (!document.components.schemas) {
		document.components.schemas = {}
	}

	for (const [dtoName, schema] of Object.entries(schemaMap)) {
		const openApiSchema = zodToOpenAPISchema(schema)
		// Remove $schema property if present (not needed for OpenAPI)
		const { $schema: _schema, ...cleanSchema } = openApiSchema as {
			$schema?: unknown
			[key: string]: unknown
		}
		void _schema
		document.components.schemas![dtoName] = cleanSchema
	}
}
