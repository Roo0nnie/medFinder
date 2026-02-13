/**
 * REST API client for todos. Uses NEXT_PUBLIC_API_BASE_URL.
 */

import type { CreateTodoInput, DeleteTodoResponse, Todo, UpdateTodoInput } from "./todos.types"

const getBaseUrl = () => {
	if (typeof window !== "undefined") return process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const url = `${base}${path}`
	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})
	if (!res.ok) {
		const text = await res.text()
		let detail: string
		try {
			const json = JSON.parse(text) as { detail?: string }
			detail = json.detail ?? text
		} catch {
			detail = text || res.statusText
		}
		throw new Error(detail)
	}
	return res.json() as Promise<T>
}

export async function fetchTodos(): Promise<Todo[]> {
	return apiFetch<Todo[]>("/api/v1/example/todos/")
}

export async function fetchTodo(id: number): Promise<Todo> {
	return apiFetch<Todo>(`/api/v1/example/todos/${id}/`)
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
	return apiFetch<Todo>("/api/v1/example/todos/", {
		method: "POST",
		body: JSON.stringify(input),
	})
}

export async function updateTodo(input: UpdateTodoInput): Promise<Todo> {
	const { id, ...body } = input
	return apiFetch<Todo>(`/api/v1/example/todos/${id}/`, {
		method: "PUT",
		body: JSON.stringify(body),
	})
}

export async function deleteTodo(id: number): Promise<DeleteTodoResponse> {
	return apiFetch<DeleteTodoResponse>(`/api/v1/example/todos/${id}/`, {
		method: "DELETE",
	})
}
