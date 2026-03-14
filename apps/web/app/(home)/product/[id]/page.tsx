import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { MapPinned } from "lucide-react"

import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"

import { ProductDetailClient } from "./product-detail-client"
import { ProductVariantSelector } from "./product-variant-selector"

type ProductPageParams = Promise<{ id: string }>

/** API product detail: medical_products + category name + pharmacy_inventory availability + variants */
type ApiProductDetail = {
	id: string
	name: string
	description?: string | null
	category?: string | null
	categoryId?: string
	genericName?: string | null
	brandName?: string | null
	dosageForm?: string | null
	manufacturer?: string | null
	imageUrl?: string | null
	strength?: string | null
	unit?: string
	priceFrom?: number | string | null
	availability?: ApiAvailabilityItem[]
	variants?: { id: string; label: string; price?: number; quantity?: number; lowStockThreshold?: number; availability?: ApiAvailabilityItem[] }[]
}

type ApiAvailabilityItem = {
	pharmacyId: string
	pharmacyName: string
	address: string
	city: string
	price: number | string
	discountPrice?: number | string | null
	quantity: number
	isAvailable: boolean
}

/** Normalized row for "Available at" list (API or fallback) */
type AvailabilityRow = {
	id: string
	name: string
	address: string
	city: string
	price?: number
	quantity?: number
}

/** Variant for product detail (API or fallback) */
export type ProductDetailVariant = {
	id: string
	label: string
	price?: number
	quantity?: number
	lowStockThreshold?: number
	availability?: AvailabilityRow[]
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
	const session = await getSession()
	if (!session || (session.user as { role?: string })?.role !== "customer") {
		redirect("/login")
	}

	const { id } = await params
	if (!id) notFound()

	const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

	// Try live API first (product detail includes category name + availability with prices).
	let product: {
		id: string
		name: string
		description?: string | null
		category?: string | null
		brand?: string
		dosage?: string
		imageUrl?: string | null
		manufacturer?: string | null
	} | null = null
	let availability: AvailabilityRow[] = []
	let displayPrice: number | null = null
	let variants: ProductDetailVariant[] = []

	if (apiBase) {
		try {
			const productRes = await fetch(`${apiBase}/v1/products/${id}/`, { cache: "no-store" })
			if (productRes.ok) {
				const api = (await productRes.json()) as ApiProductDetail
				product = {
					id: api.id,
					name: api.name,
					description: api.description ?? null,
					category: api.category ?? null,
					brand: (api.brandName ?? api.genericName ?? "") || undefined,
					dosage: api.dosageForm ?? undefined,
					imageUrl: api.imageUrl ?? null,
					manufacturer: api.manufacturer ?? null,
				}
				const priceFrom = api.priceFrom
				displayPrice = priceFrom != null ? Number(priceFrom) : null
				availability = (api.availability ?? []).map(a => ({
					id: a.pharmacyId,
					name: a.pharmacyName,
					address: a.address,
					city: a.city,
					price: Number(a.price),
					quantity: a.quantity,
				}))
				variants = (api.variants ?? []).map(v => ({
					id: v.id,
					label: v.label,
					price: v.price != null ? Number(v.price) : undefined,
					quantity: v.quantity,
					lowStockThreshold: v.lowStockThreshold,
					availability: (v.availability ?? []).map(a => ({
						id: a.pharmacyId,
						name: a.pharmacyName,
						address: a.address,
						city: a.city,
						price: Number(a.price),
						quantity: a.quantity,
					})),
				}))
				if (variants.length > 0 && displayPrice == null) {
					const prices = variants.map(v => v.price).filter((p): p is number => typeof p === "number")
					if (prices.length > 0) displayPrice = Math.min(...prices)
				}
			}
		} catch {
			product = null
		}
	}

	if (!product) {
		const fallback = landingProducts.find(p => p.id === id)
		if (!fallback) notFound()

		const pharmacyIds = fallback.availableAtStoreIds ?? [fallback.storeId]
		availability = pharmacyIds
			.map(storeId => landingPharmacies.find(p => p.id === storeId))
			.filter((p): p is (typeof landingPharmacies)[number] => Boolean(p))
			.map(ph => ({
				id: ph.id,
				name: ph.name,
				address: ph.address,
				city: ph.city ?? "",
			}))

		product = {
			id: fallback.id,
			name: fallback.name,
			description: fallback.description ?? null,
			category: fallback.category ?? null,
			dosage: fallback.dosage,
			brand: fallback.brand,
			imageUrl: fallback.imageUrl ?? null,
			manufacturer: fallback.manufacturer ?? null,
		}
		if (fallback.variants && fallback.variants.length > 0) {
			variants = fallback.variants.map(v => ({
				id: v.id,
				label: v.label,
				price: v.price,
				quantity: v.quantity,
				lowStockThreshold: v.lowStockThreshold,
				availability: [],
			}))
			const prices = fallback.variants.map(v => v.price).filter((p): p is number => typeof p === "number")
			displayPrice = prices.length > 0 ? Math.min(...prices) : null
		} else {
			displayPrice = typeof fallback.price === "number" ? fallback.price : Number(fallback.price ?? 0)
		}
	}

	const brand = product.brand ?? ""

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
				<div className="flex flex-col gap-8 sm:flex-row lg:gap-12">
					{product.imageUrl && (
						<div className="bg-muted/30 group relative flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg sm:h-72 sm:w-72">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={product.imageUrl}
								alt={product.name}
								className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-105"
							/>
						</div>
					)}
					<div className="flex min-w-0 flex-1 flex-col py-2">
						<div className="flex h-full flex-col justify-between gap-6">
							<div>
								{brand && (
									<div className="focus:ring-ring mb-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
										{brand}
									</div>
								)}
								<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
									{product.name}
								</h1>

								<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
									{product.category && (
										<div>
											<span className="text-muted-foreground">Category: </span>
											<span className="text-foreground font-medium">{product.category}</span>
										</div>
									)}
									{product.dosage && (
										<div>
											<span className="text-muted-foreground">Dosage: </span>
											<span className="text-foreground font-medium">{product.dosage}</span>
										</div>
									)}
									{(product as any).manufacturer && (
										<div>
											<span className="text-muted-foreground">Manufacturer: </span>
											<span className="text-foreground font-medium">
												{(product as any).manufacturer}
											</span>
										</div>
									)}
								</div>
							</div>
							<div className="border-t pt-6">
								{variants.length > 0 ? (
									<ProductVariantSelector
										variants={variants}
										defaultPrice={displayPrice}
										availability={availability}
									/>
								) : displayPrice != null ? (
									<p className="text-foreground text-3xl font-bold tracking-tight">
										{availability.length > 1 ? "From " : ""}₱{displayPrice.toFixed(2)}
									</p>
								) : availability.length > 0 ? (
									<p className="text-muted-foreground text-lg">Price varies by pharmacy</p>
								) : null}
							</div>
						</div>
					</div>
				</div>

				{product.description && (
					<Card className="border-border/50 bg-card/50 overflow-hidden shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
						<CardContent className="p-6">
							<h2 className="text-xl font-semibold tracking-tight">Description</h2>
							<p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
								{product.description}
							</p>
						</CardContent>
					</Card>
				)}

				<Card className="border-border/50 bg-card/50 overflow-hidden shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
					<CardContent className="p-6">
						<h2 className="text-xl font-semibold tracking-tight">Available at</h2>
						{availability.length === 0 ? (
							<p className="text-muted-foreground mt-3 text-sm">No pharmacies listed.</p>
						) : (
							<ul className="mt-4 space-y-3">
								{availability.map(row => (
									<li key={row.id}>
										<Link
											href={`/pharmacy/${row.id}` as Route}
											className="group hover:border-border hover:bg-muted/50 flex flex-col gap-1 rounded-xl border border-transparent p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="flex items-center gap-2">
												<div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors">
													<MapPinned className="h-4 w-4" />
												</div>
												<span className="text-foreground group-hover:text-primary font-medium transition-colors">
													{row.name}
												</span>
											</div>
											<div className="flex flex-col items-end gap-0.5 text-sm">
												<span className="text-muted-foreground group-hover:text-foreground transition-colors">
													{row.address}
													{row.city ? `, ${row.city}` : ""}
												</span>
											</div>
										</Link>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
