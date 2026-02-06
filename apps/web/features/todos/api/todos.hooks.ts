"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { orpc } from "@/services/orpc/orpc-client"

/**
 * Centralized query keys for todos-related queries.
 * Use these constants to ensure consistent cache invalidation.
 */
export const todosKeys = {
	all: ["todos"] as const,
	lists: () => [...todosKeys.all, "list"] as const,
	list: (filters?: string) => [...todosKeys.lists(), { filters }] as const,
}

/**
 * Query hook for fetching the todo list.
 *
 * Todos are cached for 1 minute before becoming stale.
 */
export function useTodosQuery() {
	return useQuery({
		queryKey: todosKeys.all,
		queryFn: async () => {
			const response = await orpc.todo.list()
			return response
		},
		staleTime: 60 * 1000, // 1 minute
	})
}

/**
 * Mutation hook for creating a new todo.
 *
 * Invalidates the todos query on success.
 */
export function useCreateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: { title: string }) => {
			const response = await orpc.todo.create(data)
			return response
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todosKeys.all })
		},
	})
}

/**
 * Mutation hook for updating a todo's completion status.
 *
 * Invalidates the todos query on success.
 */
export function useUpdateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
			const response = await orpc.todo.update({ id, completed })
			return response
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todosKeys.all })
		},
	})
}
