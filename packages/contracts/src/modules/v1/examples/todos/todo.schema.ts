import { z } from "zod"

export const CreateTodoSchema = z
	.object({
		title: z.string().min(1).max(255),
		completed: z.boolean().optional(),
	})
	.meta({ id: "CreateTodoDto" })

export const UpdateTodoSchema = z
	.object({
		title: z.string().min(1).max(255).optional(),
		completed: z.boolean().optional(),
	})
	.meta({ id: "UpdateTodoDto" })

export const TodoSchema = z
	.object({
		id: z.number(),
		title: z.string(),
		completed: z.boolean(),
		createdAt: z.date(),
		updatedAt: z.date(),
	})
	.meta({ id: "TodoDto" })

export type CreateTodo = z.infer<typeof CreateTodoSchema>
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>
export type Todo = z.infer<typeof TodoSchema>
