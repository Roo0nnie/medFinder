"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { type AuthSession } from "@repo/auth"

import { authClient } from "@/services/better-auth/auth-client"

/**
 * Query hook for fetching the current user session.
 *
 * Works with SessionProvider for optimal performance:
 * - Server prefetches session data during SSR
 * - Client uses hydrated data immediately (no loading state)
 * - Refetches via Better Auth client when stale
 *
 * Session is cached for 5 minutes before becoming stale.
 */
export function useSessionQuery() {
	return useQuery<AuthSession | null>({
		queryKey: ["session"],
		queryFn: async () => {
			const result = await authClient.getSession()
			if (result.error) {
				return null
			}
			return result.data as AuthSession | null
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: false,
	})
}

/**
 * Mutation hook for signing out the current user.
 *
 * Invalidates the session query and redirects to login page on success.
 */
export function useSignOutMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const result = await authClient.signOut()
			if (result.error) {
				throw new Error(result.error.message || "Failed to sign out")
			}
			return result
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session"] })
			router.push("/login")
			router.refresh()
		},
	})
}
