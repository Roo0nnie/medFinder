import { env } from "@/env"

function getCatalogSessionId(): string {
	if (typeof window === "undefined") return "ssr"
	try {
		const key = "mf_catalog_session"
		let sid = sessionStorage.getItem(key)
		if (!sid) {
			sid = crypto.randomUUID()
			sessionStorage.setItem(key, sid)
		}
		return sid
	} catch {
		return "catalog-anon"
	}
}

/**
 * Records a product view when the customer opens product details (e.g. pharmacy catalog modal).
 * Complements dwell-time events sent from the full product detail page on unmount.
 */
export function recordProductCatalogEngagement(productId: string) {
	const base = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
	void fetch(`${base}/v1/analytics/product-engagement/`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			productId,
			dwellSeconds: 0,
			sessionId: getCatalogSessionId(),
		}),
		keepalive: true,
	}).catch(() => {
		/* ignore */
	})
}
