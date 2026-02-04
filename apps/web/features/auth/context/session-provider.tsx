import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { getSession } from "@/services/better-auth/auth-server"
import { getQueryClient } from "@/services/tanstack-query/query-client"

/**
 * Server component that prefetches the session and hydrates it to the client.
 *
 * Wrap your layout or page with this component to have instant session data
 * available in client components using useSessionQuery().
 *
 * @example
 * ```tsx
 * // In a layout or page
 * export default function Layout({ children }) {
 *   return (
 *     <SessionProvider>
 *       {children}
 *     </SessionProvider>
 *   )
 * }
 * ```
 */
export async function SessionProvider({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient()

	await queryClient.prefetchQuery({
		queryKey: ["session"],
		queryFn: getSession,
	})

	return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
}
