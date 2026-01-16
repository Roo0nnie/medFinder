"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/services/better-auth/auth-client"

import type { Login } from "./login.schema"

export function useLoginMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: Login) => {
			const result = await authClient.signIn.email(data)
			if (result.error) {
				throw new Error(result.error.message || "Failed to sign in")
			}
			return result
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session"] })
			router.push("/")
			router.refresh()
		},
	})
}
