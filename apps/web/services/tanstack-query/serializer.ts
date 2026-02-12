import { StandardRPCJsonSerializer } from "@orpc/client/standard"

/**
 * oRPC JSON serializer for TanStack Query key hashing and dehydration/hydration.
 * Ensures oRPC types in query keys and cached data serialize correctly across SSR/client.
 */
export const serializer = new StandardRPCJsonSerializer({
	customJsonSerializers: [],
})
