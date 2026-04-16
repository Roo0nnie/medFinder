export type LandingProductVariant = {
	id: string
	label: string
	unit?: string
	price: number
	quantity: number
	lowStockThreshold: number
	strength?: string
	dosageForm?: string
	imageUrl?: string
	imageUrls?: string[]
}

export type LandingProduct = {
	id: string
	name: string
	brand: string
	brandId?: string
	brandName?: string
	genericName?: string
	strength?: string
	dosageForm?: string
	category: string
	dosage?: string
	description: string
	price: number
	quantity: number
	supplier: string
	storeId: string
	lowStockThreshold: number
	unit?: string
	imageUrl?: string
	manufacturer?: string
	availableAtStoreIds?: string[]
	isAvailable: boolean
	rating?: number
	variants?: LandingProductVariant[]
}

export type LandingPharmacy = {
	id: string
	name: string
	address: string
	city: string
	municipality: string
	ownerId: string
	whatIsThis?: string
	description?: string
	phone?: string
	email?: string
	website?: string
	latitude?: number
	longitude?: number
	rating?: number
	operatingHours?: string
}

