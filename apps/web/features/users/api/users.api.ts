/**
 * REST API client for users. Uses NEXT_PUBLIC_API_BASE_URL.
 */

import type { CreateUserInput, UpdateUserInput, User } from "@repo/contracts"

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
