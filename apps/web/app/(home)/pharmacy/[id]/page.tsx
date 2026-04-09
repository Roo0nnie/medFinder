import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"
import { PharmacyStorefrontHero } from "@/features/pharmacies/components/pharmacy-storefront-hero"
import { formatPharmacyAddressLine } from "@/features/pharmacies/components/pharmacy-storefront-meta"

import { mapApiProductToLandingProduct } from "@/features/landing/api/catalog.hooks"

import { getPharmacyReviews } from "./actions"
import { PharmacyDetailClient } from "./pharmacy-detail-client"
import { PharmacyPermitClient } from "./pharmacy-permit-client"
import { PharmacyProductsClient } from "./pharmacy-products-client"
import { OwnerStorefrontPreview } from "./owner-storefront-preview"

export default async function PharmacyPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>
	searchParams: Promise<{ product?: string; brand?: string }>
}) {
	const session = await getSession()
	if (!session) {
		redirect("/login")
	}
	const role = (session.user as { role?: string })?.role
	const userId = (session.user as { id?: string })?.id
	if (role !== "customer" && role !== "owner") {
		redirect("/login")
	}

	const { id } = await params
	const sp = await searchParams
	const initialProductId = typeof sp.product === "string" && sp.product.trim() ? sp.product.trim() : undefined
	const initialBrandName = typeof sp.brand === "string" && sp.brand.trim() ? sp.brand.trim() : undefined

	const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

	let pharmacy: any = null
	let productsAtPharmacy: import("@/features/landing/data/types").LandingProduct[] = []

	if (apiBase) {
		try {
			const [pharmacyRes, inventoryRes, productsRes, categoriesRes] = await Promise.all([
				fetch(`${apiBase}/v1/pharmacies/${id}/`, { cache: "no-store" }),
				fetch(`${apiBase}/v1/inventory/?pharmacyId=${encodeURIComponent(id)}`, { cache: "no-store" }),
				fetch(`${apiBase}/v1/products/`, { cache: "no-store" }),
				fetch(`${apiBase}/v1/products/categories/`, { cache: "no-store" }),
			])

			if (pharmacyRes.ok) {
				pharmacy = await pharmacyRes.json()
				const inventory = inventoryRes.ok ? await inventoryRes.json() : []
				const products = productsRes.ok ? await productsRes.json() : []
				const categories = categoriesRes.ok ? await categoriesRes.json() : []
				const categoryMap = new Map<string, string>(
					(categories as { id?: string; categoryId?: string; name?: string }[]).map(c => [
						(c.id ?? c.categoryId) as string,
						c.name ?? "Uncategorized",
					])
				)
				const inventoryByProduct = new Map<string, unknown[]>()
				for (const row of inventory as any[]) {
					const pid = row.productId ?? row.product_id
					if (!pid) continue
					const list = inventoryByProduct.get(pid) ?? []
					list.push(row)
					inventoryByProduct.set(pid, list)
				}
				const productIds = new Set(inventoryByProduct.keys())
				productsAtPharmacy = (products as Record<string, unknown>[])
					.filter(p => productIds.has(p.id as string))
					.map(p =>
						mapApiProductToLandingProduct(p, inventoryByProduct.get(p.id as string) ?? [], categoryMap)
					)
					.filter((x): x is NonNullable<typeof x> => x != null)
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

	if (role === "owner") {
		const ownerId = (pharmacy as { ownerId?: string | null })?.ownerId ?? null
		if (!ownerId || !userId || ownerId !== userId) notFound()
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
	const isOwnerPreview = role === "owner"

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
			{isOwnerPreview ? <OwnerStorefrontPreview /> : null}
			<Link
				href={(isOwnerPreview ? "/dashboard/owner/pharmacies" : "/") as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back {isOwnerPreview ? "to My pharmacy" : "to home"}
			</Link>

			<div className="space-y-10">
				<PharmacyStorefrontHero
					name={pharmacy.name}
					description={pharmacy.description}
					subtitleFallback={pharmacy.whatIsThis}
					ownerImage={pharmacy.ownerImage}
					logo={pharmacy.logo}
					mediaCacheKey={pharmacy.updatedAt}
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

				{pharmacy.certificateFileUrl && pharmacy.certificateStatus === "approved" ? (
					<Card className="animate-in fade-in slide-in-from-bottom-4 border-border/50 bg-card/50 fill-mode-both overflow-hidden shadow-sm backdrop-blur-sm transition-all delay-100 duration-300 hover:shadow-md">
						<CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1">
								<h2 className="text-base font-semibold tracking-tight">Business permit</h2>
								<p className="text-muted-foreground text-sm">
									Verify this pharmacy’s business certificate.
								</p>
							</div>
							<PharmacyPermitClient
								pharmacyName={pharmacy.name}
								certificateFileUrl={pharmacy.certificateFileUrl}
							/>
						</CardContent>
					</Card>
				) : null}

				<Card
					id="pharmacy-products"
					className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 border-border/50 bg-card/50 fill-mode-both overflow-hidden shadow-sm backdrop-blur-sm transition-all delay-150 duration-300 hover:shadow-md"
				>
					<CardContent className="space-y-6 p-6">
						<h2 className="text-xl font-semibold tracking-tight">Products available here</h2>
						{productsAtPharmacy.length === 0 ? (
							<p className="text-muted-foreground mt-2 text-sm italic">No products listed.</p>
						) : (
							<PharmacyProductsClient
								products={productsAtPharmacy}
								pharmacyName={pharmacy.name}
								pharmacyId={pharmacy.id}
								initialProductId={initialProductId}
								initialBrandName={initialBrandName}
							/>
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
