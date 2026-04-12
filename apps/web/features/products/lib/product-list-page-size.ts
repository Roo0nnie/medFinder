/** Allowed values for product list pagination (landing + pharmacy storefront). */
export const PAGE_SIZE_OPTIONS = [4, 12, 24, 58, 100] as const

export type ProductListPageSize = (typeof PAGE_SIZE_OPTIONS)[number]

/** Key for `localStorage` + `storage` event sync across tabs. */
export const PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY = "medfinder:products-per-page"

const DEFAULT_PAGE_SIZE: ProductListPageSize = 12

function isPageSize(n: number): n is ProductListPageSize {
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
}

/** Read persisted page size (client-only; safe on server — returns default). */
export function getStoredProductListPageSize(): ProductListPageSize {
	if (typeof window === "undefined") return DEFAULT_PAGE_SIZE
	try {
		const raw = window.localStorage.getItem(PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY)
		if (raw == null) return DEFAULT_PAGE_SIZE
		const n = Number.parseInt(raw, 10)
		if (!Number.isFinite(n) || !isPageSize(n)) return DEFAULT_PAGE_SIZE
		return n
	} catch {
		return DEFAULT_PAGE_SIZE
	}
}

export function setStoredProductListPageSize(size: ProductListPageSize): void {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY, String(size))
	} catch {
		// quota / private mode
	}
}

export { DEFAULT_PAGE_SIZE as DEFAULT_PRODUCT_LIST_PAGE_SIZE }
