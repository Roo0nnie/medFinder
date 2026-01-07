import { z } from "zod"

// ============================================================================
// API RESPONSE WRAPPERS
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

// ============================================================================
// PAGINATION & UTILITIES
// ============================================================================

export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const HealthCheckSchema = z.object({
	status: z.enum(["ok", "error"]),
	timestamp: z.iso.datetime(),
	uptime: z.number(),
	version: z.string(),
	environment: z.string(),
	checks: z.object({
		database: z
			.object({
				status: z.string(),
				message: z.string().optional(),
			})
			.catchall(z.unknown()),
		cache: z.object({
			status: z.string(),
			message: z.string().optional(),
		}),
	}),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Pagination = z.infer<typeof PaginationSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type ApiSuccessResponse<T> = z.infer<
	ReturnType<typeof ApiSuccessResponseSchema<z.ZodType<T>>>
>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
