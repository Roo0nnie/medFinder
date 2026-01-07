import { createZodDto } from "nestjs-zod"
import { z } from "zod"

import { ApiSuccessResponseSchema } from "../../../common/common.schemas.js"

// ============================================================================
// SCHEMAS
// ============================================================================

export const CreateTodoSchema = z.object({
	title: z.string().min(1).max(255),
	completed: z.boolean().optional(),
})

export const UpdateTodoSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	completed: z.boolean().optional(),
})

export const TodoSchema = z.object({
	id: z.number(),
	title: z.string(),
	completed: z.boolean(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})

export type Todo = z.infer<typeof TodoSchema>

// ============================================================================
// DTOs
// ============================================================================

export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}

export class UpdateTodoDto extends createZodDto(UpdateTodoSchema) {}

export class TodoResponseDto extends createZodDto(ApiSuccessResponseSchema(TodoSchema)) {}

export class TodoListResponseDto extends createZodDto(
	ApiSuccessResponseSchema(TodoSchema.array())
) {}
