import { createZodDto } from "nestjs-zod"
import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		data: dataSchema,
		message: z.string().optional(),
	})

export const ApiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.any().optional(),
	}),
	timestamp: z.string().datetime(),
})

export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ApiSuccessResponse<T> = z.infer<
	ReturnType<typeof ApiSuccessResponseSchema<z.ZodType<T>>>
>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type Pagination = z.infer<typeof PaginationSchema>

// ============================================================================
// DTOs
// ============================================================================

export class ApiErrorResponseDto extends createZodDto(ApiErrorResponseSchema) {}

export class PaginationDto extends createZodDto(PaginationSchema) {}

/**
 * Convenience helper to create a DTO class for a standard
 * success response envelope wrapping the provided schema.
 *
 * @example
 * ```ts
 * export class TodoListResponseDto extends ApiSuccessDto(z.array(TodoSchema), "TodoListResponseDto") {}
 * ```
 */
export const ApiSuccessDto = <T extends z.ZodTypeAny>(
	schema: T,
	className: string
): new () => z.infer<ReturnType<typeof ApiSuccessResponseSchema<T>>> => {
	const DtoClass = createZodDto(ApiSuccessResponseSchema(schema)) as new () => z.infer<
		ReturnType<typeof ApiSuccessResponseSchema<T>>
	>

	// Set the class name for better debugging and documentation
	Object.defineProperty(DtoClass, "name", { value: className })

	return DtoClass
}
