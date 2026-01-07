import { ApiSuccessResponseSchema, HealthCheckSchema } from "../common/common.schemas.js"
import { AuthSchema } from "../modules/v1/auth/auth.schema.js"
import {
	CreateTodoSchema,
	TodoSchema,
	UpdateTodoSchema,
} from "../modules/v1/examples/todos/todo.schema.js"

/**
 * Map of schema names to Zod schemas for automatic OpenAPI registration.
 * Key: DTO / model name (e.g., "CreateTodoDto")
 * Value: Corresponding Zod schema.
 */
export const schemaMap = {
	HealthCheckDto: HealthCheckSchema,
	CreateTodoDto: CreateTodoSchema,
	UpdateTodoDto: UpdateTodoSchema,
	TodoDto: TodoSchema,
	TodoResponseDto: ApiSuccessResponseSchema(TodoSchema),
	TodoListResponseDto: ApiSuccessResponseSchema(TodoSchema.array()),
	AuthDto: AuthSchema,
} as const
