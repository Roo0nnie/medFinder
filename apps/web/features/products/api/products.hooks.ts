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

/** Multipart upload; do not set Content-Type (browser sets boundary). */
export async function uploadVariantImage(productId: string, variantId: string, file: File): Promise<ProductVariant> {
	const base = getBaseUrl().replace(/\/$/, "")
	const fd = new FormData()
	fd.append("file", file)
	const res = await fetch(
		`${base}/v1/products/manage/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/upload-image/`,
		{
			method: "POST",
			body: fd,
			credentials: "include",
		}
	)
	if (!res.ok) {
		const text = await res.text()
		let message = text || res.statusText
		try {
			const j = JSON.parse(text) as { detail?: string }
			if (j.detail) message = j.detail
		} catch {
			/* use raw */
		}
		throw new Error(message)
	}
	return res.json() as Promise<ProductVariant>
}

export type ProductVariant = {
	id: string
	productId: string
	label: string
	unit: string
	sortOrder: number
	strength?: string | null
	dosageForm?: string | null
	imageUrl?: string | null
	/** Gallery URLs; when empty server may fall back to imageUrl in API responses. */
	imageUrls?: string[] | null
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
	brandId?: string | null
	brandName?: string
	genericName?: string
	categoryId: string
	manufacturer?: string
	requiresPrescription: boolean
	description?: string
	/** Create payload: first variant display label (separate from strength). */
	variantLabel?: string
	/** Present on create payload only; stored on the first variant server-side. */
	dosageForm?: string
	/** Present on create payload only; stored on the first variant server-side. */
	strength?: string
	/** Present on create payload only; sell unit for the first variant. */
	unit?: string
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

/** PUT /v1/products/manage/:id/ — product fields plus optional per-variant inventory upsert */
export type ProductManageUpdateInput = Partial<Product> & {
	id: string
	variantId?: string | null
}

export type ProductCategory = {
	id: string
	name: string
	description?: string
	parentCategoryId?: string | null
	requiresPrescription: boolean
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
	unit?: string | null
	strength?: string | null
	dosageForm?: string | null
	imageUrl?: string | null
	imageUrls?: string[] | null
	availability?: ProductDetailAvailabilityItem[]
	price?: number | null
	quantity?: number | null
	lowStockThreshold?: number | null
}

export type ProductDetail = Omit<Product, "variants"> & {
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

export type ProductBrandAvailableRow = {
	brandId?: string | null
	brandName: string
	productId: string
	pharmacyCount: number
}

export function useProductBrandsAvailableQuery(
	productId: string | undefined,
	options?: { variantId?: string | null }
) {
	const variantId = options?.variantId?.trim() || undefined
	return useQuery({
		queryKey: ["product-brands-available", productId, variantId ?? null],
		queryFn: () => {
			const sp = new URLSearchParams()
			if (variantId) sp.set("variantId", variantId)
			const q = sp.toString()
			const basePath = `/v1/products/${encodeURIComponent(productId ?? "")}/brands-available/`
			return apiFetch<ProductBrandAvailableRow[]>(q ? `${basePath}?${q}` : basePath)
		},
		enabled: !!productId,
	})
}

export type ProductPharmacyForBrandRow = {
	pharmacyId: string
	pharmacyName: string
	address: string
	city: string
	latitude?: number | null
	longitude?: number | null
	price: number | string
	quantity: number
	productId: string
}

export function useProductPharmaciesForBrandQuery(
	productId: string | undefined,
	params: { brandId?: string | null; brandName?: string | null } | undefined
) {
	const brandId = params?.brandId?.trim() || undefined
	const brandName = params?.brandName?.trim() || undefined
	return useQuery({
		queryKey: ["product-pharmacies-for-brand", productId, brandId, brandName],
		queryFn: () => {
			const sp = new URLSearchParams()
			if (brandId) sp.set("brandId", brandId)
			else if (brandName) sp.set("brandName", brandName)
			return apiFetch<ProductPharmacyForBrandRow[]>(
				`/v1/products/${encodeURIComponent(productId ?? "")}/pharmacies-for-brand/?${sp.toString()}`
			)
		},
		enabled: !!productId && (!!brandId || !!brandName),
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

function invalidateVariantRelatedQueries(qc: ReturnType<typeof useQueryClient>, productId: string) {
	qc.invalidateQueries({ queryKey: ["product-variants", productId] })
	qc.invalidateQueries({ queryKey: ["product-detail", productId] })
	qc.invalidateQueries({ queryKey: ["products"] })
	qc.invalidateQueries({ queryKey: ["inventory"] })
	qc.invalidateQueries({ queryKey: ["landing", "catalog"] })
}

export function useVariantCreateMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			productId,
			label,
			unit,
			sortOrder,
			strength,
			dosageForm,
			imageUrl,
			imageUrls,
		}: {
			productId: string
			label: string
			unit?: string
			sortOrder?: number
			strength?: string
			dosageForm?: string
			imageUrl?: string
			imageUrls?: string[] | null
		}) => {
			const body = Object.fromEntries(
				Object.entries({
					label,
					unit,
					sortOrder,
					strength,
					dosageForm,
					imageUrl,
					imageUrls,
				}).filter(([, v]) => v !== undefined)
			)
			return apiFetch<ProductVariant>(`/v1/products/${encodeURIComponent(productId)}/variants/`, {
				method: "POST",
				body: JSON.stringify(body),
			})
		},
		onSuccess: (_, { productId }) => {
			invalidateVariantRelatedQueries(qc, productId)
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
			unit,
			sortOrder,
			strength,
			dosageForm,
			imageUrl,
			imageUrls,
		}: {
			productId: string
			variantId: string
			label?: string
			unit?: string
			sortOrder?: number
			strength?: string
			dosageForm?: string
			imageUrl?: string
			imageUrls?: string[] | null
		}) => {
			const body = Object.fromEntries(
				Object.entries({
					label,
					unit,
					sortOrder,
					strength,
					dosageForm,
					imageUrl,
					imageUrls,
				}).filter(([, v]) => v !== undefined)
			)
			return apiFetch<ProductVariant>(
				`/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/`,
				{
					method: "PUT",
					body: JSON.stringify(body),
				}
			)
		},
		onSuccess: (_, { productId }) => {
			invalidateVariantRelatedQueries(qc, productId)
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
			invalidateVariantRelatedQueries(qc, productId)
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
		mutationFn: ({ id, ...input }: ProductManageUpdateInput) =>
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
