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

export type Pharmacy = {
	id: string
	ownerId: string
	name: string
	description?: string | null
	address: string
	city: string
	state: string
	zipCode: string
	country?: string
	latitude?: number | null
	longitude?: number | null
	phone?: string | null
	email?: string | null
	website?: string | null
	operatingHours?: string | null
	logo?: string | null
	googleMapEmbed?: string | null
	socialLinks?: string | null
	isActive: boolean
	createdAt?: string
	updatedAt?: string
}

export function useMyPharmaciesQuery() {
	return useQuery({
		queryKey: ["pharmacies", "mine"],
		queryFn: () => apiFetch<Pharmacy[]>("/v1/pharmacies/my-pharmacies/"),
	})
}

export function usePharmacyCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<Pharmacy>) =>
			apiFetch<Pharmacy>("/v1/pharmacies/create/", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacies"] }),
	})
}

export function usePharmacyUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<Pharmacy> & { id: string }) =>
			apiFetch<Pharmacy>(`/v1/pharmacies/${id}/`, {
				method: "PUT",
				body: JSON.stringify(input),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacies"] }),
	})
}

export function usePharmacyDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean; id: string }>(`/v1/pharmacies/${id}/`, {
				method: "DELETE",
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacies"] }),
	})
}
