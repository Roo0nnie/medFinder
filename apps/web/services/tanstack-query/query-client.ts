import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query"

export const makeQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 30 * 1000,
			},
			dehydrate: {
				shouldDehydrateQuery: query =>
					defaultShouldDehydrateQuery(query) || query.state.status === "pending",
			},
		},
	})

let clientQueryClientSingleton: QueryClient | undefined = undefined
export const getQueryClient = () => {
	// Server: always make a new query client
	if (isServer) {
		return makeQueryClient()
	}
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= makeQueryClient()
	return clientQueryClientSingleton
}
