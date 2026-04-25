import { useQuery } from "@tanstack/react-query"

import type { Pharmacy } from "@/features/pharmacies/api/pharmacies.hooks"

const getBaseUrl = () =>
	(typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL) ?? ""

async function apiFetch<T>(path: string): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}${path}`, {
		credentials: "include",
		headers: { Accept: "application/json" },
	})
	if (!res.ok) {
		throw new Error((await res.text()) || res.statusText)
	}
	return res.json() as Promise<T>
}

export type NearestPharmacy = Pharmacy

export function useNearestPharmaciesQuery(args: {
	lat: number | null
	lng: number | null
	radiusKm?: number
	limit?: number
	enabled?: boolean
}) {
	const { lat, lng, radiusKm = 50, limit = 25, enabled = true } = args
	const ok =
		enabled &&
		typeof lat === "number" &&
		typeof lng === "number" &&
		Number.isFinite(lat) &&
		Number.isFinite(lng)

	const qs = new URLSearchParams()
	if (ok) {
		qs.set("lat", String(lat))
		qs.set("lng", String(lng))
		qs.set("radiusKm", String(radiusKm))
		qs.set("limit", String(limit))
	}

	return useQuery({
		queryKey: ["pharmacies", "nearest", lat, lng, radiusKm, limit],
		queryFn: () => apiFetch<NearestPharmacy[]>(`/v1/pharmacies/nearest/?${qs.toString()}`),
		enabled: ok,
		staleTime: 60_000,
	})
}
