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

export async function uploadPharmacyCertificate(
	pharmacyId: string,
	file: File,
	certificateNumber: string
): Promise<Pharmacy> {
	const base = getBaseUrl().replace(/\/$/, "")
	const fd = new FormData()
	fd.append("file", file)
	fd.append("certificateNumber", certificateNumber)
	const res = await fetch(`${base}/v1/pharmacies/${pharmacyId}/certificate/`, {
		method: "POST",
		body: fd,
		credentials: "include",
	})
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

export async function reviewPharmacyCertificate(
	pharmacyId: string,
	status: "approved" | "rejected",
	reviewNote?: string
): Promise<Pharmacy> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}/v1/pharmacies/${pharmacyId}/certificate/review/`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ status, reviewNote }),
	})
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
	certificateFileUrl?: string | null
	certificateNumber?: string | null
	certificateStatus?: "pending" | "approved" | "rejected" | null
	certificateSubmittedAt?: string | null
	certificateReviewedAt?: string | null
	certificateReviewedBy?: string | null
	certificateReviewNote?: string | null
	googleMapEmbed?: string | null
	socialLinks?: string | null
	isActive: boolean
	createdAt?: string
	updatedAt?: string
	/** Straight-line distance in km when returned from nearest endpoint. */
	distance?: number | null
}

export function useMyPharmaciesQuery() {
	return useQuery({
		queryKey: ["pharmacies", "mine"],
		queryFn: () => apiFetch<Pharmacy[]>("/v1/pharmacies/my-pharmacies/"),
	})
}

export function useAdminPharmaciesQuery(status?: "pending" | "approved" | "rejected") {
	const query = status ? `?verificationStatus=${encodeURIComponent(status)}` : ""
	return useQuery({
		queryKey: ["pharmacies", "admin", status ?? "all"],
		queryFn: () => apiFetch<Pharmacy[]>(`/v1/pharmacies/${query}`),
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

export function usePharmacyCertificateReviewMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			status,
			reviewNote,
		}: {
			id: string
			status: "approved" | "rejected"
			reviewNote?: string
		}) => reviewPharmacyCertificate(id, status, reviewNote),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacies"] }),
	})
}
