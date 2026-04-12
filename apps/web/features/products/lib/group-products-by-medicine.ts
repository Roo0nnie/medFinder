import type { LandingProduct } from "@/features/landing/data/types"

function norm(s: string | undefined): string {
	return (s ?? "").trim().toLowerCase()
}

export function medicineGroupKey(p: LandingProduct): string {
	const g = norm(p.genericName)
	if (g) {
		return `g:${g}`
	}
	return `n:${norm(p.name)}`
}
export function getMedicineGroup(clicked: LandingProduct, allProducts: LandingProduct[]): LandingProduct[] {
	const key = medicineGroupKey(clicked)
	return allProducts.filter(p => medicineGroupKey(p) === key)
}

export function brandLabelForProduct(p: LandingProduct): string {
	const raw = (p.brandName ?? "").trim()
	if (raw) return raw
	const generic = (p.genericName ?? "").trim()
	if (generic && p.name.trim() !== generic) return p.name.trim()
	return "Unbranded"
}

/** Stable key for sibling brand rows: prefer canonical brandId when present. */
export function brandKeyForProduct(p: LandingProduct): string {
	const id = (p.brandId ?? "").trim()
	if (id) return `id:${id}`
	return `lbl:${brandLabelForProduct(p)}`
}
