export interface LandingProductVariant {
	id: string
	label: string
	price: number
	quantity: number
	lowStockThreshold: number
}

export interface LandingProduct {
	id: string
	name: string
	brand: string
	category: string
	dosage?: string
	description?: string
	price: number
	quantity: number
	supplier: string
	storeId: string
	lowStockThreshold: number
	unit?: string
	variants?: LandingProductVariant[]
	/** Product photo URL for detail page */
	imageUrl?: string
	manufacturer?: string
	/** Display rating 1–5; when using DB, computed from product_reviews */
	rating?: number
	/** Pharmacy IDs where this product is available; if omitted, only storeId is used */
	availableAtStoreIds?: string[]
}

export interface LandingPharmacy {
	id: string
	name: string
	address: string
	city: string
	municipality: string
	ownerId?: string
	/** Short intro line ("what is this" / tagline) */
	whatIsThis?: string
	description?: string
	phone?: string
	email?: string
	website?: string
	latitude?: number
	longitude?: number
	/** Display rating 1–5; when using DB, computed from pharmacy_reviews */
	rating?: number
	operatingHours?: string
}
