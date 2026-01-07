import { createZodDto } from "nestjs-zod"
import { type z } from "zod"

import { ApiSuccessResponseSchema } from "../common/common.schemas.js"

/**
 * Type helper to extract the instance type from a DTO class
 * @example
 * ```ts
 * export class CreateTodoDto extends createDto(CreateTodoSchema, "CreateTodoDto") {}
 * export type CreateTodoDtoType = DtoType<typeof CreateTodoDto>
 * ```
 */
export type DtoType<T extends abstract new (...args: unknown[]) => unknown> = InstanceType<T>

/**
 * Type helper to infer the DTO type directly from a Zod schema
 * This is equivalent to z.infer but provides better semantic meaning for DTOs
 * @example
 * ```ts
 * export type CreateTodoDtoType = DtoFromSchema<typeof CreateTodoSchema>
 * ```
 */
export type DtoFromSchema<T extends z.ZodTypeAny> = z.infer<T>

/**
 * The magic function that converts Zod schemas to NestJS DTOs
 * with automatic Swagger documentation
 */
export function createDto<T extends z.ZodTypeAny>(
	schema: T,
	className: string
): new () => z.infer<T> {
	const DtoClass = createZodDto(schema) as new () => z.infer<T>

	// Set the class name for better debugging and documentation
	Object.defineProperty(DtoClass, "name", { value: className })

	return DtoClass
}

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
): new () => z.infer<ReturnType<typeof ApiSuccessResponseSchema<T>>> =>
	createDto(ApiSuccessResponseSchema(schema), className)

/**
 * Batch create DTOs from multiple schemas
 */
export function createDtos<T extends Record<string, z.ZodTypeAny>>(
	schemas: T
): { [K in keyof T]: ReturnType<typeof createDto<T[K]>> } {
	const dtos = {} as Record<string, ReturnType<typeof createDto<z.ZodTypeAny>>>

	for (const [key, schema] of Object.entries(schemas)) {
		const className = key.replace(/Schema$/, "Dto")
		dtos[key] = createDto(schema, className)
	}

	return dtos as { [K in keyof T]: ReturnType<typeof createDto<T[K]>> }
}
