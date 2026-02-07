import { OpenAPILink } from "@orpc/openapi-client/fetch"

import { contract } from "@repo/contracts"

import { env } from "@/env"
import { getCookieHeader } from "@/core/lib/cookie-utils"

export function createOrpcLink() {
	return new OpenAPILink(contract, {
		url: env.NEXT_PUBLIC_API_BASE_URL,
		fetch: async (url, init) => {
			const isServer = typeof window === "undefined"
			const initHeaders = init && "headers" in init ? (init as RequestInit).headers : undefined
			const headers = new Headers(initHeaders)
			headers.set("Content-Type", "application/json")

			if (isServer) {
				const cookieHeader = await getCookieHeader()
				if (cookieHeader) {
					headers.set("cookie", cookieHeader)
				}
			}

			return fetch(url, {
				...init,
				headers,
				...(isServer ? { cache: "no-store", next: { revalidate: 0 } } : {}),
			})
		},
	})
}
