"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { postSessionAuditEvent } from "@/features/dashboard/api/analytics.hooks"
import { authClient } from "@/services/better-auth/auth-client"
import { sessionKeys } from "@/features/auth/api/session.hooks"

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
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: sessionKeys.all })

			const session = await authClient.getSession()
			const role = (session?.data?.user as { role?: string } | undefined)?.role

			await postSessionAuditEvent("login")

			if (role === "admin") {
				router.push("/dashboard/admin")
			} else if (role === "owner") {
				router.push("/dashboard/owner")
			} else if (role === "staff") {
				router.push("/dashboard/staff")
			} else {
				router.push("/")
			}

			router.refresh()
		},
	})
}
