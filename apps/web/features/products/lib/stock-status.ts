export type StockStatusKind = "not_for_sale" | "out_of_stock" | "low_stock" | "in_stock"

export type StockStatusInput = {
	quantity: number
	isAvailable?: boolean
	lowStockThreshold: number
}

/**
 * Unified stock labels for owner, staff, and customer surfaces.
 * When `isAvailable` is false, item is not offered for sale (distinct from out of stock).
 */
export function getStockStatus(input: StockStatusInput): {
	kind: StockStatusKind
	label: string
} {
	const { quantity, isAvailable = true, lowStockThreshold } = input
	if (!isAvailable) {
		return { kind: "not_for_sale", label: "Not available" }
	}
	if (quantity <= 0) {
		return { kind: "out_of_stock", label: "Out of stock" }
	}
	if (quantity <= lowStockThreshold) {
		return { kind: "low_stock", label: "Low stock" }
	}
	return { kind: "in_stock", label: "In stock" }
}
