import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const getBaseUrl = () =>
	(typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL) ??
	""

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
		throw new Error((await res.text()) || res.statusText)
	}
	return res.json() as Promise<T>
}

export type PharmacyReview = {
	id: string
	pharmacyId: string
	pharmacyName?: string | null
	userId: string
	rating: number
	comment?: string
	createdAt?: string
	user?: {
		id: string
		firstName?: string | null
		lastName?: string | null
		image?: string | null
	}
}

export function usePharmacyReviewQuery(id?: string, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ["reviews", "pharmacy", "byId", id ?? ""],
		queryFn: () => apiFetch<PharmacyReview>(`/v1/reviews/pharmacies/${id}/`),
		enabled: options?.enabled ?? Boolean(id),
	})
}

export function usePharmacyReviewsQuery(
	pharmacyId?: string,
	rating?: number,
	options?: { enabled?: boolean }
) {
	const params = new URLSearchParams()
	if (pharmacyId) params.set("pharmacyId", pharmacyId)
	if (typeof rating === "number") params.set("rating", String(rating))
	const queryString = params.toString()
	const path = `/v1/reviews/pharmacies/${queryString ? `?${queryString}` : ""}`

	return useQuery({
		queryKey: ["reviews", "pharmacy", pharmacyId, rating],
		queryFn: () => apiFetch<PharmacyReview[]>(path),
		enabled: options?.enabled ?? !!pharmacyId,
	})
}

export function usePharmacyReviewDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean; id: string }>(`/v1/reviews/pharmacies/${id}/`, {
				method: "DELETE",
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
	})
}
