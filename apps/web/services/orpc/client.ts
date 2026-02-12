import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import type { JsonifiedClient } from "@orpc/openapi-client"
import { OpenAPILink } from "@orpc/openapi-client/fetch"

import { type V1Contract, v1Contract } from "@repo/contracts"

import { env } from "@/env"

export type OrpcClient = JsonifiedClient<ContractRouterClient<V1Contract>>

declare global {
	var $orpc: OrpcClient | undefined
}

interface OrpcLinkOptions {
	getCookieHeader?: () => Promise<string>
}

export function createOrpcLink(options?: OrpcLinkOptions) {
	return new OpenAPILink(v1Contract, {
		url: env.NEXT_PUBLIC_API_BASE_URL,
		fetch: async (url, init) => {
			const isServer = typeof window === "undefined"
			const initHeaders = init && "headers" in init ? (init as RequestInit).headers : undefined
			const headers = new Headers(initHeaders)
			headers.set("Content-Type", "application/json")

			if (isServer && options?.getCookieHeader) {
				const cookieHeader = await options.getCookieHeader()
				if (cookieHeader) {
					headers.set("cookie", cookieHeader)
				}
			}

			return fetch(url, {
				...init,
				headers,
				credentials: "include",
				...(isServer ? { cache: "no-store", next: { revalidate: 0 } } : {}),
			})
		},
	})
}

const link = createOrpcLink()

/**
 * Type-safe oRPC client for frontend API calls.
 * Uses OpenAPI Link to communicate with the NestJS backend via HTTP.
 */
export const orpc: OrpcClient = globalThis.$orpc ?? createORPCClient<OrpcClient>(link)
