import { z } from "zod"

import { ApiSuccessDto } from "../../../common/common.contract.js"
import { createDto } from "../../../utils/dto-generator.js"

// ============================================================================
// SCHEMAS
// ============================================================================

export const TodoSchema = z.object({
	id: z.number(),
	title: z.string(),
	completed: z.boolean(),
	authorId: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})

export const CreateTodoSchema = TodoSchema.pick({
	title: true,
	completed: true,
})
export const UpdateTodoSchema = TodoSchema.pick({
	title: true,
	completed: true,
})

export type Todo = z.infer<typeof TodoSchema>

// ============================================================================
// DTOs
// ============================================================================

export class CreateTodoDto extends createDto(CreateTodoSchema, "CreateTodoDto") {}

export class UpdateTodoDto extends createDto(UpdateTodoSchema, "UpdateTodoDto") {}

export class TodoDto extends ApiSuccessDto(TodoSchema, "TodoDto") {}

export class TodoListDto extends ApiSuccessDto(TodoSchema.array(), "TodoListDto") {}
