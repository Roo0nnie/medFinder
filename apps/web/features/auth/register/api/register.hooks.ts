"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/services/better-auth/auth-client"

import type { Register } from "./register.schema"

export function useRegisterMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: Register) => {
			const result = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: data.name || "",
			})
			if (result.error) {
				throw new Error(result.error.message || "Failed to sign up")
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
