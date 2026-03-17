import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { env } from "@/env"

const getBaseUrl = () =>
	(typeof window !== "undefined"
		? env.NEXT_PUBLIC_API_BASE_URL
		: env.NEXT_PUBLIC_API_BASE_URL) ?? ""

function parseErrorBody(text: string): string {
	try {
		const data = JSON.parse(text)
		if (data.detail && typeof data.detail === "string") return data.detail
		if (typeof data === "object" && data !== null) {
			const parts = Object.entries(data).flatMap(([k, v]) =>
				Array.isArray(v) ? v.map((s: string) => `${k}: ${s}`) : [`${k}: ${String(v)}`]
			)
			if (parts.length) return parts.join(". ")
		}
	} catch {
		// ignore
	}
	return text || "Request failed"
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(parseErrorBody(body))
	}
	return res.json() as Promise<T>
}

export type ProductVariant = {
	id: string
	productId: string
	label: string
	sortOrder: number
}

export type PharmacyInventoryItem = {
	id: string
	pharmacyId: string
	productId: string
	variantId?: string | null
	variantLabel?: string | null
	quantity: number
	price: string
	discountPrice?: string | null
	expiryDate?: string | null
	batchNumber?: string | null
	isAvailable: boolean
	lastRestocked?: string | null
	createdAt?: string
	updatedAt?: string
}

export type Product = {
	id: string
	pharmacyId?: string | null
	name: string
	brandName?: string
	genericName?: string
	categoryId: string
	unit: string
	manufacturer?: string
	requiresPrescription: boolean
	description?: string
	dosageForm?: string
	strength?: string
	imageUrl?: string
	supplier?: string
	lowStockThreshold?: number | null
	quantity?: number
	price?: string
	discountPrice?: string | null
	expiryDate?: string | null
	batchNumber?: string | null
	isAvailable?: boolean
	variants?: ProductVariant[]
}

export type ProductCategory = {
	id: string
	name: string
	description?: string
	parentCategoryId?: string | null
}

export type InventoryListParams = {
	pharmacyId?: string
	productId?: string
	isAvailable?: boolean
}

export function useProductsQuery() {
	return useQuery({
		queryKey: ["products"],
		queryFn: () => apiFetch<Product[]>("/v1/products/"),
	})
}

export type ProductSearchParams = {
	query?: string
	categoryId?: string
	requiresPrescription?: boolean
	manufacturer?: string
	limit?: number
	offset?: number
	prefix?: boolean
	searchType?: "plain" | "websearch"
}

export function useProductSearchQuery(params: ProductSearchParams = {}) {
	return useQuery({
		queryKey: ["products", "search", params],
		queryFn: () => {
			const search = new URLSearchParams()
			if (params.query) search.set("query", params.query)
			if (params.categoryId) search.set("categoryId", params.categoryId)
			if (params.requiresPrescription !== undefined)
				search.set("requiresPrescription", String(params.requiresPrescription))
			if (params.manufacturer) search.set("manufacturer", params.manufacturer)
			if (params.limit !== undefined) search.set("limit", String(params.limit))
			if (params.offset !== undefined) search.set("offset", String(params.offset))
			if (params.prefix !== undefined) search.set("prefix", String(params.prefix))
			if (params.searchType) search.set("searchType", params.searchType)
			const suffix = search.toString() ? `?${search.toString()}` : ""
			return apiFetch<Product[]>(`/v1/products/${suffix}`)
		},
	})
}

export type ProductDetailAvailabilityItem = {
	pharmacyId: string
	pharmacyName: string
	address: string
	city: string
	price: number | string
	discountPrice?: number | string | null
	quantity: number
	isAvailable: boolean
	variantId?: string | null
}

export type ProductDetailVariant = {
	id: string
	label: string
	availability?: ProductDetailAvailabilityItem[]
	price?: number | null
	quantity?: number | null
	lowStockThreshold?: number | null
}

export type ProductDetail = Product & {
	category?: string | null
	availability?: ProductDetailAvailabilityItem[]
	priceFrom?: number | null
	variants?: ProductDetailVariant[]
}

export function useProductDetailQuery(productId: string | undefined) {
	return useQuery({
		queryKey: ["product-detail", productId],
		queryFn: () =>
			apiFetch<ProductDetail>(`/v1/products/${encodeURIComponent(productId ?? "")}/`),
		enabled: !!productId,
	})
}

export function useProductCategoriesQuery() {
	return useQuery({
		queryKey: ["product-categories"],
		queryFn: () => apiFetch<ProductCategory[]>("/v1/products/categories/"),
	})
}

export function useInventoryListQuery(params: InventoryListParams = {}) {
	return useQuery({
		queryKey: ["inventory", "list", params],
		queryFn: () => {
			const search = new URLSearchParams()
			if (params.pharmacyId) search.set("pharmacyId", params.pharmacyId)
			if (params.productId) search.set("productId", params.productId)
			if (params.isAvailable !== undefined) search.set("isAvailable", String(params.isAvailable))
			const suffix = search.toString() ? `?${search.toString()}` : ""
			return apiFetch<PharmacyInventoryItem[]>(`/v1/inventory/${suffix}`)
		},
	})
}

export function useInventoryByProductQuery(productId: string | undefined) {
	return useQuery({
		queryKey: ["inventory", "by-product", productId],
		queryFn: async (): Promise<PharmacyInventoryItem | null> => {
			if (!productId) return null
			const list = await apiFetch<PharmacyInventoryItem[]>(
				`/v1/inventory/?productId=${encodeURIComponent(productId)}`
			)
			return list[0] ?? null
		},
		enabled: !!productId,
	})
}

export function useProductVariantsQuery(productId: string | undefined) {
	return useQuery({
		queryKey: ["product-variants", productId],
		queryFn: () =>
			apiFetch<ProductVariant[]>(`/v1/products/${encodeURIComponent(productId ?? "")}/variants/`),
		enabled: !!productId,
	})
}

export function useVariantCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ productId, label, sortOrder }: { productId: string; label: string; sortOrder?: number }) =>
			apiFetch<ProductVariant>(`/v1/products/${encodeURIComponent(productId)}/variants/`, {
				method: "POST",
				body: JSON.stringify({ label, sortOrder: sortOrder ?? 0 }),
			}),
		onSuccess: (_, { productId }) => {
			qc.invalidateQueries({ queryKey: ["product-variants", productId] })
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useVariantUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			productId,
			variantId,
			label,
			sortOrder,
		}: {
			productId: string
			variantId: string
			label?: string
			sortOrder?: number
		}) =>
			apiFetch<ProductVariant>(`/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/`, {
				method: "PUT",
				body: JSON.stringify({ label, sortOrder }),
			}),
		onSuccess: (_, { productId }) => {
			qc.invalidateQueries({ queryKey: ["product-variants", productId] })
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useVariantDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
			apiFetch<{ success: boolean; id: string }>(
				`/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/`,
				{ method: "DELETE" }
			),
		onSuccess: (_, { productId }) => {
			qc.invalidateQueries({ queryKey: ["product-variants", productId] })
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useProductCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<Product>) =>
			apiFetch<Product>("/v1/products/manage/", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useProductUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<Product> & { id: string }) =>
			apiFetch<Product>(`/v1/products/manage/${id}/`, {
				method: "PUT",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useProductDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean; id: string }>(`/v1/products/manage/${id}/`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["products"] })
			qc.invalidateQueries({ queryKey: ["inventory"] })
		},
	})
}

export function useInventoryCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<PharmacyInventoryItem>) =>
			apiFetch<PharmacyInventoryItem>("/v1/inventory/", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["inventory"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useInventoryUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<PharmacyInventoryItem> & { id: string }) =>
			apiFetch<PharmacyInventoryItem>(`/v1/inventory/${id}/`, {
				method: "PUT",
				body: JSON.stringify(input),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
	})
}

export function useInventoryDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean; id: string }>(`/v1/inventory/${id}/`, {
				method: "DELETE",
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
	})
}

export function useCategoryCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<ProductCategory>) =>
			apiFetch<ProductCategory>("/v1/products/categories/", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["product-categories"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useCategoryUpdateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<ProductCategory> & { id: string }) =>
			apiFetch<ProductCategory>(`/v1/products/categories/${id}/`, {
				method: "PUT",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["product-categories"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}

export function useCategoryDeleteMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean; id: string }>(`/v1/products/categories/${id}/`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["product-categories"] })
			qc.invalidateQueries({ queryKey: ["products"] })
		},
	})
}
