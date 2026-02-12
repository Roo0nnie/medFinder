import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { orpc } from "./client"

/**
 * TanStack Query utilities for oRPC procedures.
 * Use .queryOptions() / .mutationOptions() with useQuery/useMutation, and .key() for invalidation.
 * Base path ["orpc"] avoids key collisions with non-oRPC queries (e.g. session).
 */
export const orpcTQ = createTanstackQueryUtils(orpc, {
	path: ["orpc"],
})
