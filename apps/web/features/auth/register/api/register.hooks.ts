"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/services/better-auth/auth-client"
import { sessionKeys } from "@/features/auth/api/session.hooks"

import type { Register } from "./register.schema"

function signUpErrorMessage(raw: string): string {
	const lower = raw.toLowerCase()
	if (
		lower.includes("unique") ||
		lower.includes("already") ||
		lower.includes("exists") ||
		lower.includes("duplicate")
	) {
		return "This email is already registered"
	}
	return raw
}

export function useRegisterMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: Register) => {
			const name = `${data.firstName} ${data.lastName}`.trim() || data.email
			const result = await authClient.signUp.email({
				name,
				email: data.email,
				password: data.password,
				firstName: data.firstName,
				lastName: data.lastName,
			} as { name: string; email: string; password: string })
			if (result.error) {
				const msg = result.error.message || "Failed to sign up"
				throw new Error(signUpErrorMessage(msg))
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
