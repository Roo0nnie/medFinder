/**
 * Todo type as returned by the Django REST API (camelCase).
 */
export interface Todo {
	id: number
	title: string
	completed: boolean
	authorId: string
	createdAt: string
	updatedAt: string
}

export interface CreateTodoInput {
	title: string
	completed?: boolean
}

export interface UpdateTodoInput {
	id: number
	title?: string
	completed?: boolean
}

export interface DeleteTodoResponse {
	success: boolean
	id: number
}
