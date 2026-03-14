import { useQuery } from "@tanstack/react-query"

import type { LandingPharmacy, LandingProduct } from "../data/types"

/** Backend API base, e.g. http://localhost:8000/api (no trailing slash). */
const getBaseUrl = () => {
	const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return base
}

export type LandingCategory = {
	id: string
	name: string
	ownerId: string
}

type CatalogData = {
	products: LandingProduct[]
	pharmacies: LandingPharmacy[]
	categories: LandingCategory[]
}

async function fetchJson<T>(path: string): Promise<T> {
	const base = getBaseUrl()
	if (!base) {
		throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")
	}
	const normalized = base.replace(/\/$/, "")
	const res = await fetch(`${normalized}${path}`, { credentials: "include" })
	if (!res.ok) {
		throw new Error(`Failed to fetch ${path}: ${res.statusText}`)
	}
	return res.json() as Promise<T>
}

async function fetchCatalog(): Promise<CatalogData> {
	const [products, pharmacies, categories, inventory] = await Promise.all([
		fetchJson<any[]>("/v1/products/"),
		fetchJson<any[]>("/v1/pharmacies/"),
		fetchJson<any[]>("/v1/products/categories/"),
		// inventory is optional for now – if it fails we still want basic products/pharmacies
		fetchJson<any[]>("/v1/inventory/").catch(() => []),
	])

	const categoryMap = new Map<string, string>(
		categories.map(c => [c.id ?? c.categoryId ?? c.id, c.name ?? c.title ?? "Uncategorized"])
	)
	const categoriesMapped: LandingCategory[] = (categories ?? []).map((c: any) => ({
		id: c.id ?? c.categoryId ?? "",
		name: c.name ?? c.title ?? "Uncategorized",
		ownerId: c.ownerId ?? c.owner_id ?? "",
	}))

	const inventoryByProduct = new Map<string, any[]>()
	for (const row of inventory ?? []) {
		const productId = row.productId ?? row.product_id
		if (!productId) continue
		const existing = inventoryByProduct.get(productId) ?? []
		existing.push(row)
		inventoryByProduct.set(productId, existing)
	}

	const productsMapped: LandingProduct[] = []

	for (const product of products) {
		const productId = product.id
		if (!productId) continue

		const rows = inventoryByProduct.get(productId) ?? []
		const hasInventory = rows.length > 0
		const primary = rows[0]
		const availableAtStoreIds = hasInventory
			? Array.from(
					new Set(
						rows
							.map(r => r.pharmacyId ?? r.pharmacy_id)
							.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
					)
				)
			: []
		const totalQuantity = hasInventory
			? rows.reduce(
					(sum: number, r: any) => sum + (typeof r.quantity === "number" ? r.quantity : 0),
					0
				)
			: 0
		const priceNumber = hasInventory
			? Number(primary.discountPrice ?? primary.discount_price ?? primary.price ?? 0)
			: 0
		const storeId = hasInventory
			? (primary.pharmacyId ?? primary.pharmacy_id) ?? ""
			: (product.pharmacyId ?? product.pharmacy_id) ?? ""

		const variantsRaw = product.variants as { id: string; label: string; price: number; quantity: number; lowStockThreshold: number }[] | undefined
		const variants =
			Array.isArray(variantsRaw) && variantsRaw.length > 0
				? variantsRaw.map(v => ({
						id: v.id,
						label: v.label,
						price: Number(v.price) ?? 0,
						quantity: Number(v.quantity) ?? 0,
						lowStockThreshold: Number(v.lowStockThreshold) ?? 5,
					}))
				: undefined

		productsMapped.push({
			id: productId,
			name: product.name,
			brand: product.brandName ?? product.genericName ?? product.name,
			category: categoryMap.get(product.categoryId) ?? "Uncategorized",
			dosage: product.dosageForm ?? product.strength ?? undefined,
			description: product.description ?? "",
			price: Number.isFinite(priceNumber) ? priceNumber : 0,
			quantity: totalQuantity,
			supplier: product.manufacturer ?? "Unknown",
			storeId,
			lowStockThreshold: product.lowStockThreshold ?? 5,
			unit: product.unit ?? "piece",
			imageUrl: product.imageUrl ?? undefined,
			manufacturer: product.manufacturer ?? undefined,
			availableAtStoreIds: availableAtStoreIds.length ? availableAtStoreIds : undefined,
			variants,
		})
	}

	const pharmaciesMapped: LandingPharmacy[] = pharmacies.map((p: any) => ({
		id: p.id,
		name: p.name,
		address: p.address,
		city: p.city,
		municipality: p.municipality ?? p.state ?? "",
		ownerId: p.ownerId ?? p.owner_id,
		whatIsThis: p.whatIsThis ?? p.tagline ?? undefined,
		description: p.description ?? undefined,
		phone: p.phone ?? undefined,
		email: p.email ?? undefined,
		website: p.website ?? undefined,
		latitude: p.latitude ?? undefined,
		longitude: p.longitude ?? undefined,
		rating: typeof p.rating === "number" ? p.rating : undefined,
		operatingHours: p.operatingHours ?? undefined,
	}))

	return { products: productsMapped, pharmacies: pharmaciesMapped, categories: categoriesMapped }
}

export function useLandingCatalog() {
	return useQuery({
		queryKey: ["landing", "catalog"],
		queryFn: fetchCatalog,
		staleTime: 60_000,
	})
}
