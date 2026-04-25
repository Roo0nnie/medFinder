/**
 * REST API client for users. Uses NEXT_PUBLIC_API_BASE_URL.
 */

import type { CreateUserInput, UpdateUserInput, User } from "@repo/contracts"

/** API user row including optional stored map location fields. */
export type MeUser = User & {
	latitude?: number | null
	longitude?: number | null
	locationAccuracy?: number | null
	locationUpdatedAt?: string | null
	locationConsentAt?: string | null
}

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
			const json = JSON.parse(text) as { detail?: string }
			detail = json.detail ?? text
		} catch {
			detail = text || res.statusText
		}
		throw new Error(detail)
	}
	return res.json() as Promise<T>
}

export async function fetchUsers(): Promise<User[]> {
	return apiFetch<User[]>("/v1/users/")
}

export async function fetchUser(id: string): Promise<User> {
	return apiFetch<User>(`/v1/users/${id}/`)
}

export async function createUser(input: CreateUserInput): Promise<User> {
	return apiFetch<User>("/v1/users/", {
		method: "POST",
		body: JSON.stringify({
			email: input.email,
			password: input.password,
			firstName: input.firstName,
			lastName: input.lastName,
			middleName: input.middleName,
			role: input.role,
		}),
	})
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	return apiFetch<User>(`/v1/users/${id}/`, {
		method: "PUT",
		body: JSON.stringify(input),
	})
}

export async function deleteUser(id: string): Promise<{ success: boolean; id: string }> {
	return apiFetch<{ success: boolean; id: string }>(`/v1/users/${id}/`, {
		method: "DELETE",
	})
}

export type SaveMyLocationInput = {
	latitude: number
	longitude: number
	accuracy?: number | null
	/** Must be true to persist coordinates on the server. */
	consent: boolean
}

/** Persist the signed-in user's last-known coordinates (requires consent: true). */
export async function saveMyUserLocation(body: SaveMyLocationInput): Promise<MeUser> {
	return apiFetch<MeUser>("/v1/users/me/location/", {
		method: "POST",
		body: JSON.stringify(body),
	})
}

/** Clear stored coordinates for the signed-in user. */
export async function clearMyUserLocation(): Promise<MeUser> {
	return apiFetch<MeUser>("/v1/users/me/location/", {
		method: "DELETE",
	})
}
