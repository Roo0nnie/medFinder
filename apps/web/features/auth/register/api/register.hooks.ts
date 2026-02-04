"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/services/better-auth/auth-client"
import { sessionKeys } from "@/features/auth/api/session.hooks"

import type { Register } from "./register.schema"

export function useRegisterMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: Register) => {
			const result = await authClient.signUp.email(data)
			if (result.error) {
				throw new Error(result.error.message || "Failed to sign up")
			}
			return result
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.all })
			router.push("/")
			router.refresh()
		},
	})
}
