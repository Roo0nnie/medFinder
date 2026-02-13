"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createTodo, deleteTodo, fetchTodos, updateTodo } from "./todos.api"
import type { CreateTodoInput, UpdateTodoInput } from "./todos.types"

export const todosQueryKey = ["todos"] as const

/**
 * Query hook for fetching the todo list.
 * Todos are cached for 1 minute before becoming stale.
 */
export function useTodosQuery() {
	return useQuery({
		queryKey: todosQueryKey,
		queryFn: fetchTodos,
		staleTime: 60 * 1000,
	})
}

/**
 * Mutation hook for creating a new todo.
 * Invalidates the todos query on success.
 */
export function useCreateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: CreateTodoInput) => createTodo(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todosQueryKey })
		},
	})
}

/**
 * Mutation hook for updating a todo.
 * Invalidates the todos query on success.
 */
export function useUpdateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: UpdateTodoInput) => updateTodo(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todosQueryKey })
		},
	})
}

/**
 * Mutation hook for deleting a todo.
 * Invalidates the todos query on success.
 */
export function useDeleteTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => deleteTodo(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todosQueryKey })
		},
	})
}
