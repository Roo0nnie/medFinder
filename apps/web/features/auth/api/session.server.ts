import { cache } from "react"
import { cookies } from "next/headers"

import { type AuthSession } from "@repo/auth"

import { getAuthUrl } from "@/services/better-auth/auth-utils"

export const getSession = cache(async (): Promise<AuthSession | null> => {
	const cookieStore = await cookies()
	const cookieHeader = cookieStore
		.getAll()
		.map(cookie => `${cookie.name}=${cookie.value}`)
		.join("; ")

	const response = await fetch(`${getAuthUrl()}/get-session`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"cookie": cookieHeader,
		},
		cache: "no-store",
	}).then(res => res.json())

	return response
})
