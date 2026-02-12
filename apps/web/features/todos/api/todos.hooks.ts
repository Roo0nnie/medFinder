"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { orpcTQ } from "@/services/orpc/orpc-tanstack"

/**
 * Query hook for fetching the todo list.
 *
 * Todos are cached for 1 minute before becoming stale.
 */
export function useTodosQuery() {
	return useQuery(
		orpcTQ.example.todo.list.queryOptions({
			staleTime: 60 * 1000, // 1 minute
		})
	)
}

/**
 * Mutation hook for creating a new todo.
 *
 * Invalidates the todos query on success.
 */
export function useCreateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcTQ.example.todo.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpcTQ.example.todo.key() })
			},
		})
	)
}

/**
 * Mutation hook for updating a todo's completion status.
 *
 * Invalidates the todos query on success.
 */
export function useUpdateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcTQ.example.todo.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpcTQ.example.todo.key() })
			},
		})
	)
}

/**
 * Mutation hook for deleting a todo.
 *
 * Invalidates the todos query on success.
 */
export function useDeleteTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcTQ.example.todo.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpcTQ.example.todo.key() })
			},
		})
	)
}
