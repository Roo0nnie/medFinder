import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"
import { PharmacyStorefrontHero } from "@/features/pharmacies/components/pharmacy-storefront-hero"
import { formatPharmacyAddressLine } from "@/features/pharmacies/components/pharmacy-storefront-meta"

import { getPharmacyReviews } from "./actions"
import { PharmacyDetailClient } from "./pharmacy-detail-client"
import { PharmacyProductsClient } from "./pharmacy-products-client"

export default async function PharmacyPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession()
	if (!session || (session.user as { role?: string })?.role !== "customer") {
		redirect("/login")
	}

	const { id } = await params
	const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

	let pharmacy: any = null
	let productsAtPharmacy: any[] = []

	if (apiBase) {
		try {
			const [pharmacyRes, inventoryRes, productsRes] = await Promise.all([
				fetch(`${apiBase}/v1/pharmacies/${id}/`, { cache: "no-store" }),
				fetch(`${apiBase}/v1/inventory/?pharmacyId=${id}`, { cache: "no-store" }),
				fetch(`${apiBase}/v1/products/`, { cache: "no-store" }),
			])

			if (pharmacyRes.ok) {
				pharmacy = await pharmacyRes.json()
				const inventory = inventoryRes.ok ? await inventoryRes.json() : []
				const products = productsRes.ok ? await productsRes.json() : []
				const productIds = new Set((inventory as any[]).map(item => item.productId))
				productsAtPharmacy = (products as any[]).filter(p => productIds.has(p.id))
			}
		} catch {
			pharmacy = null
		}
	}

	if (!pharmacy) {
		pharmacy = landingPharmacies.find(p => p.id === id)
		if (!pharmacy) notFound()
		productsAtPharmacy = landingProducts.filter(
			p => p.storeId === pharmacy.id || p.availableAtStoreIds?.includes(pharmacy.id)
		)
	}

	const hasCoordinates = pharmacy.latitude != null && pharmacy.longitude != null
	const mapUrl = hasCoordinates
		? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`
		: null
	const mapEmbedUrl = hasCoordinates
		? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}&output=embed`
		: null

	const addressLine = formatPharmacyAddressLine({
		address: pharmacy.address,
		city: pharmacy.city ?? "",
		state: pharmacy.state ?? "",
		zipCode: pharmacy.zipCode,
		country: pharmacy.country,
		municipality: pharmacy.municipality,
	})
	const externalMapFromAddress =
		!mapUrl && addressLine.trim().length > 0
			? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
			: null

	const { reviews, averageRating, reviewCount } = await getPharmacyReviews(pharmacy.id)
	const headerAverageRating =
		averageRating != null ? averageRating : pharmacy.rating != null ? pharmacy.rating : null

	const ratingForHero =
		headerAverageRating != null ? { value: headerAverageRating, reviewCount } : null
	const showNoReviewsYet = ratingForHero == null && reviewCount === 0

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="space-y-10">
				<PharmacyStorefrontHero
					name={pharmacy.name}
					description={pharmacy.description}
					subtitleFallback={pharmacy.whatIsThis}
					ownerImage={pharmacy.ownerImage}
					logo={pharmacy.logo}
					addressLine={addressLine}
					phone={pharmacy.phone}
					email={pharmacy.email}
					website={pharmacy.website}
					operatingHours={pharmacy.operatingHours}
					mapEmbedUrl={mapEmbedUrl}
					externalMapUrl={mapUrl ?? externalMapFromAddress}
					rating={ratingForHero}
					showNoReviewsYet={showNoReviewsYet}
					hideLocationDetails
					productCount={productsAtPharmacy.length}
				/>

				<Card
					id="pharmacy-products"
					className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 border-border/50 bg-card/50 fill-mode-both overflow-hidden shadow-sm backdrop-blur-sm transition-all delay-150 duration-300 hover:shadow-md"
				>
					<CardContent className="space-y-6 p-6">
						<h2 className="text-xl font-semibold tracking-tight">Products available here</h2>
						{productsAtPharmacy.length === 0 ? (
							<p className="text-muted-foreground mt-2 text-sm italic">No products listed.</p>
						) : (
							<PharmacyProductsClient products={productsAtPharmacy} pharmacyName={pharmacy.name} />
						)}
					</CardContent>
				</Card>

				<div
					id="pharmacy-reviews"
					className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-200 duration-500"
				>
					<PharmacyDetailClient
						pharmacyId={pharmacy.id}
						initialRating={pharmacy.rating}
						initialAverageRating={averageRating}
						initialReviewCount={reviewCount}
						initialReviews={reviews}
					/>
				</div>
			</div>
		</div>
	)
}
