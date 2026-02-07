import { OpenAPILink } from "@orpc/openapi-client/fetch"

import { contract } from "@repo/contracts"

import { env } from "@/env"

export function createOrpcLink() {
	return new OpenAPILink(contract, {
		url: env.NEXT_PUBLIC_API_BASE_URL,
		fetch: async (url, init) => {
			const isServer = typeof window === "undefined"
			const initHeaders = init && "headers" in init ? (init as RequestInit).headers : undefined
			const headers = new Headers(initHeaders)
			headers.set("Content-Type", "application/json")

			if (isServer) {
				const { cookies } = await import("next/headers")
				const cookieStore = await cookies()
				const cookieHeader = cookieStore
					.getAll()
					.map(cookie => `${cookie.name}=${cookie.value}`)
					.join("; ")

				if (cookieHeader) {
					headers.set("cookie", cookieHeader)
				}
			}

			return fetch(url, {
				...init,
				credentials: "include",
				headers,
				...(isServer ? { cache: "no-store", next: { revalidate: 0 } } : {}),
			})
		},
	})
}
