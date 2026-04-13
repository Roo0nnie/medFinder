/** Allowed values for product list pagination (landing + pharmacy storefront). Multiples of 3 so a 3-column grid fills rows evenly. */
export const PAGE_SIZE_OPTIONS = [3, 6, 12, 24, 60, 99] as const

export type ProductListPageSize = (typeof PAGE_SIZE_OPTIONS)[number]

/** Key for `localStorage` + `storage` event sync across tabs. */
export const PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY = "medfinder:products-per-page"

const DEFAULT_PAGE_SIZE: ProductListPageSize = 6

/** Previous option values → nearest valid size after options were constrained to multiples of 3. */
const LEGACY_STORED_PAGE_SIZE: Partial<Record<number, ProductListPageSize>> = {
	2: 3,
	4: 6,
	58: 60,
	100: 99,
}

function isPageSize(n: number): n is ProductListPageSize {
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
}

/**
 * Map a numeric value from storage or a `storage` event to a valid page size
 * (includes legacy values that are no longer in {@link PAGE_SIZE_OPTIONS}).
 */
export function normalizeProductListPageSize(n: number): ProductListPageSize {
	if (!Number.isFinite(n)) return DEFAULT_PAGE_SIZE
	if (isPageSize(n)) return n
	const migrated = LEGACY_STORED_PAGE_SIZE[n]
	if (migrated != null) return migrated
	return DEFAULT_PAGE_SIZE
}

/** Read persisted page size (client-only; safe on server — returns default). */
export function getStoredProductListPageSize(): ProductListPageSize {
	if (typeof window === "undefined") return DEFAULT_PAGE_SIZE
	try {
		const raw = window.localStorage.getItem(PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY)
		if (raw == null) return DEFAULT_PAGE_SIZE
		const n = Number.parseInt(raw, 10)
		const resolved = normalizeProductListPageSize(n)
		if (n in LEGACY_STORED_PAGE_SIZE) {
			try {
				window.localStorage.setItem(PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY, String(resolved))
			} catch {
				// quota / private mode
			}
		}
		return resolved
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
