import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const getBaseUrl = () =>
	(typeof window !== "undefined"
		? process.env.NEXT_PUBLIC_API_BASE_URL
		: process.env.NEXT_PUBLIC_API_BASE_URL) ?? ""

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
		throw new Error(body || res.statusText)
	}
	return res.json() as Promise<T>
}

export type DeletionRequest = {
	id: string
	productId: string
	pharmacyId: string
	requestedBy: string
	reviewedBy: string | null
	status: string
	reason: string | null
	createdAt: string
	updatedAt: string
}

export type DeletionRequestsQueryParams = {
	pharmacyId?: string
	status?: string
}

export function useDeletionRequestsQuery(params: DeletionRequestsQueryParams = {}) {
	return useQuery({
		queryKey: ["deletion-requests", params],
		queryFn: () => {
			const search = new URLSearchParams()
			if (params.pharmacyId) search.set("pharmacyId", params.pharmacyId)
			if (params.status) search.set("status", params.status)
			const qs = search.toString()
			const path = qs ? `/v1/deletion-requests/?${qs}` : "/v1/deletion-requests/"
			return apiFetch<DeletionRequest[]>(path)
		},
	})
}

export function useCreateDeletionRequestMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: { productId: string; pharmacyId: string; reason?: string }) =>
			apiFetch<DeletionRequest>("/v1/deletion-requests/", {
				method: "POST",
				body: JSON.stringify({
					productId: input.productId,
					pharmacyId: input.pharmacyId,
					reason: input.reason ?? "",
				}),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["deletion-requests"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useDeletionRequestApproveMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (requestId: string) =>
			apiFetch<DeletionRequest>(`/v1/deletion-requests/${encodeURIComponent(requestId)}/`, {
				method: "POST",
				body: JSON.stringify({ action: "approve" }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["deletion-requests"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useDeletionRequestRejectMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (requestId: string) =>
			apiFetch<DeletionRequest>(`/v1/deletion-requests/${encodeURIComponent(requestId)}/`, {
				method: "POST",
				body: JSON.stringify({ action: "reject" }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["deletion-requests"] })
		},
	})
}
