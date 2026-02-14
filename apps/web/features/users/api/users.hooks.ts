"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateUserInput, UpdateUserInput } from "@repo/contracts"

import { createUser, deleteUser, fetchUser, fetchUsers, updateUser } from "./users.api"

export const usersQueryKey = ["users"] as const

export function useUsersQuery() {
	return useQuery({
		queryKey: usersQueryKey,
		queryFn: fetchUsers,
		staleTime: 60 * 1000,
	})
}

export function useUserQuery(id: string | null) {
	return useQuery({
		queryKey: [...usersQueryKey, id],
		queryFn: () => fetchUser(id!),
		enabled: !!id,
	})
}

export function useCreateUserMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: CreateUserInput) => createUser(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKey })
		},
	})
}

export function useUpdateUserMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) => updateUser(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKey })
		},
	})
}

export function useDeleteUserMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => deleteUser(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKey })
		},
	})
}
