import { env } from "@/env"

/**
 * Fire-and-forget: record that a product was opened from global search (owner analytics).
 */
export function recordProductSearchSelection(input: {
	productId: string
	pharmacyId?: string | null
	searchQuery?: string
}): void {
	const base = (env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "")
	if (!base) return
	const body = JSON.stringify({
		productId: input.productId,
		pharmacyId: input.pharmacyId ?? undefined,
		searchQuery: input.searchQuery ?? "",
	})
	void fetch(`${base}/v1/analytics/product-search-selection/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body,
	}).catch(() => {})
}
