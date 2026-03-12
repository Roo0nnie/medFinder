"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { Staff, StaffCreate, StaffListResponse, StaffUpdate } from "@repo/contracts"

export const staffQueryKey = ["orpc", "v1", "staff"] as const

const getBaseUrl = () => {
	if (typeof window !== "undefined") return process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const url = `${base}${path}`
	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})

	if (!res.ok) {
		const text = await res.text()
		let detail: string
		try {
			const json = JSON.parse(text) as { detail?: string; message?: string }
			detail = json.detail ?? json.message ?? text
		} catch {
			detail = text || res.statusText
		}
		throw new Error(detail)
	}

	return res.json() as Promise<T>
}

interface StaffListParams {
	search?: string
	limit?: number
	offset?: number
	isActive?: boolean
}

export function useStaffListQuery(params: StaffListParams = {}) {
	const { search, limit, offset, isActive } = params

	return useQuery({
		queryKey: [...staffQueryKey, { search, limit, offset, isActive }],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (search) params.set("search", search)
			if (typeof limit === "number") params.set("limit", String(limit))
			if (typeof offset === "number") params.set("offset", String(offset))
			if (typeof isActive === "boolean") {
				params.set("is_active", isActive ? "true" : "false")
			}

			const query = params.toString()
			const path = `/v1/staff/${query ? `?${query}` : ""}`
			return apiFetch<StaffListResponse>(path)
		},
	})
}

export function useStaffGetQuery(id: string | null) {
	return useQuery({
		queryKey: [...staffQueryKey, id],
		queryFn: () => apiFetch<Staff>(`/v1/staff/${id}/`),
		enabled: !!id,
	})
}

export function useCreateStaffMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (input: StaffCreate): Promise<Staff> => {
			return apiFetch<Staff>("/v1/staff/create/", {
				method: "POST",
				body: JSON.stringify(input),
			})
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffQueryKey })
		},
	})
}

export function useUpdateStaffMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (input: StaffUpdate & { id: string }): Promise<Staff> => {
			const { id, ...rest } = input
			return apiFetch<Staff>(`/v1/staff/${id}/`, {
				method: "PUT",
				body: JSON.stringify(rest),
			})
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffQueryKey })
		},
	})
}

export function useDeleteStaffMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ id }: { id: string }): Promise<{ success: boolean; id: string }> => {
			return apiFetch<{ success: boolean; id: string }>(`/v1/staff/${id}/`, {
				method: "DELETE",
			})
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffQueryKey })
		},
	})
}
