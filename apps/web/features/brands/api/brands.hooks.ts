import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { env } from "@/env"

const getBaseUrl = () =>
	(typeof window !== "undefined"
		? env.NEXT_PUBLIC_API_BASE_URL
		: env.NEXT_PUBLIC_API_BASE_URL) ?? ""

function parseErrorBody(text: string): string {
	try {
		const data = JSON.parse(text)
		if (data.detail && typeof data.detail === "string") return data.detail
	} catch {
		// ignore
	}
	return text || "Request failed"
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(parseErrorBody(body))
	}
	return res.json() as Promise<T>
}

async function apiFetchVoid(path: string, options: RequestInit = {}): Promise<void> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(parseErrorBody(body))
	}
}

export type Brand = {
	id: string
	name: string
	normalizedName: string
	createdAt?: string
	updatedAt?: string
}

export type AdminBrandRow = Brand & {
	ownerCount: number
	productCount: number
}

export function useBrandsSearchQuery(search: string, limit = 20, enabled = true) {
	return useQuery({
		queryKey: ["brands", "search", search, limit],
		queryFn: () => {
			const q = new URLSearchParams()
			if (search.trim()) q.set("search", search.trim())
			q.set("limit", String(limit))
			return apiFetch<Brand[]>(`/v1/brands/?${q.toString()}`)
		},
		enabled,
	})
}

export function useMyBrandsQuery(enabled = true) {
	return useQuery({
		queryKey: ["brands", "mine"],
		queryFn: () => apiFetch<Brand[]>("/v1/brands/mine/"),
		enabled,
	})
}

export function useBrandCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: { name: string }) =>
			apiFetch<Brand>("/v1/brands/", {
				method: "POST",
				body: JSON.stringify({ name: input.name }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["brands"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useBrandMineUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: { brandId: string; name: string }) =>
			apiFetch<Brand>(`/v1/brands/mine/${encodeURIComponent(input.brandId)}/`, {
				method: "PUT",
				body: JSON.stringify({ name: input.name }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["brands"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useBrandUnlinkMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (brandId: string) =>
			apiFetchVoid(`/v1/brands/mine/${encodeURIComponent(brandId)}/`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["brands"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useAdminBrandsQuery(enabled = true) {
	return useQuery({
		queryKey: ["brands", "admin"],
		queryFn: () => apiFetch<AdminBrandRow[]>("/v1/admin/brands/"),
		enabled,
	})
}

export function useAdminBrandDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetchVoid(`/v1/admin/brands/${encodeURIComponent(id)}/`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["brands"] })
		},
	})
}
