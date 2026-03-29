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

/** Multipart upload; do not set Content-Type (browser sets boundary). */
export async function uploadPharmacyImage(
	pharmacyId: string,
	kind: "logo" | "owner",
	file: File
): Promise<Pharmacy> {
	const base = getBaseUrl().replace(/\/$/, "")
	const fd = new FormData()
	fd.append("file", file)
	const res = await fetch(
		`${base}/v1/pharmacies/${pharmacyId}/upload-image/?kind=${encodeURIComponent(kind)}`,
		{
			method: "POST",
			body: fd,
			credentials: "include",
		}
	)
	if (!res.ok) {
		const text = await res.text()
		let message = text || res.statusText
		try {
			const j = JSON.parse(text) as { detail?: string }
			if (j.detail) message = j.detail
		} catch {
			/* use raw */
		}
		throw new Error(message)
	}
	return res.json() as Promise<Pharmacy>
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
	ownerImage?: string | null
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
