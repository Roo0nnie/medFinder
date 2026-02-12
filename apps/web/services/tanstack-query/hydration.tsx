import { dehydrate, HydrationBoundary, type QueryClient } from "@tanstack/react-query"

interface HydrateClientProps {
	children: React.ReactNode
	client: QueryClient
}

/**
 * Wraps children with HydrationBoundary so dehydrated state from the given QueryClient
 * is hydrated on the client. Use from server components after prefetching.
 */
export function HydrateClient({ children, client }: HydrateClientProps) {
	return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
}
