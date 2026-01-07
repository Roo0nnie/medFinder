import { type z } from "zod"

/**
 * Type helper to extract the instance type from a DTO class
 * @example
 * ```ts
 * export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}
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
