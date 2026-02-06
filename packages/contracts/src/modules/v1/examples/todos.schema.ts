import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const TodoSchema = z.object({
	id: z.number().int().positive(),
	title: z.string().min(1, "Title is required").max(255, "Title too long"),
	completed: z.boolean().default(false),
	authorId: z.string(),
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().default(new Date()),
})

export const TodoIdSchema = z.object({
	id: z.coerce.number().int().positive(),
})

export const CreateTodoSchema = TodoSchema.pick({
	title: true,
	completed: true,
})

export const UpdateTodoSchema = TodoSchema.pick({
	title: true,
	completed: true,
}).partial()

// ============================================================================
// TYPEs
// ============================================================================

export type Todo = z.infer<typeof TodoSchema>
export type TodoIdInput = z.infer<typeof TodoIdSchema>
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>
