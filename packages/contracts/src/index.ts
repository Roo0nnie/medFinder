import { AuthSchema } from "./v1/auth/auth.schema.js"
import { CreateTodoSchema, TodoSchema, UpdateTodoSchema } from "./v1/examples/todos/todo.schema.js"

export * from "./v1/examples/todos/todo.schema.js"
export * from "./v1/examples/todos/todo.dto.js"
export * from "./v1/auth/auth.schema.js"
export * from "./v1/auth/auth.dto.js"
export * from "./utils/dto-generator.js"

/**
 * Map of schema names to Zod schemas for automatic OpenAPI registration
 * Key: DTO name (e.g., "CreateTodoDto")
 * Value: Corresponding Zod schema
 */
export const schemaMap = {
	CreateTodoDto: CreateTodoSchema,
	UpdateTodoDto: UpdateTodoSchema,
	TodoDto: TodoSchema,
	AuthDto: AuthSchema,
} as const
