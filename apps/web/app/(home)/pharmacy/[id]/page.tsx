import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"

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

	const { reviews, averageRating, reviewCount } = await getPharmacyReviews(pharmacy.id)
	const headerAverageRating =
		averageRating != null ? averageRating : pharmacy.rating != null ? pharmacy.rating : null

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="space-y-10">
				<section className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 gap-6 duration-500 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
					{mapEmbedUrl && (
						<Card className="border-border/50 bg-card/50 h-full overflow-hidden shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
							<CardContent className="flex h-full flex-col gap-4 p-4 sm:p-6">
								<div className="bg-muted/30 flex-1 overflow-hidden rounded-lg border">
									<iframe
										title={`Map for ${pharmacy.name}`}
										src={mapEmbedUrl}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										className="h-72 w-full border-0 sm:h-80"
									/>
								</div>
								{mapUrl && (
									<a
										href={mapUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:text-primary/80 mt-2 text-center text-sm font-medium"
									>
										Open in Google Maps
									</a>
								)}
							</CardContent>
						</Card>
					)}

					<div className="space-y-4">
						<div className="flex h-full flex-col justify-between">
							<div>
								<div className="space-y-3">
									<h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
										{pharmacy.name}
									</h1>
									{pharmacy.whatIsThis && (
										<p className="text-muted-foreground text-lg sm:text-xl">
											{pharmacy.whatIsThis}
										</p>
									)}
								</div>
							</div>

							<div className="flex flex-col gap-6">
								{headerAverageRating != null && (
									<div className="flex flex-wrap items-center gap-3 text-sm">
										<div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1">
											<span className="text-base font-semibold">
												{headerAverageRating.toFixed(1)}
											</span>
											<span className="text-primary/80 text-xs">/ 5</span>
											{reviewCount > 0 && (
												<span className="text-primary/80 text-xs">
													({reviewCount} review{reviewCount !== 1 ? "s" : ""})
												</span>
											)}
										</div>
									</div>
								)}

								<div className="bg-card/60 border-border/50 overflow-hidden rounded-2xl border p-6 text-sm shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
									<div className="text-foreground text-base font-semibold tracking-tight">
										Pharmacy details
									</div>
									<div className="text-muted-foreground mt-4 space-y-3">
										<p>
											<span className="text-foreground font-medium">Address: </span>
											{pharmacy.address}, {pharmacy.municipality}, {pharmacy.city}
										</p>
										{pharmacy.operatingHours && (
											<p>
												<span className="text-foreground font-medium">Hours: </span>
												{pharmacy.operatingHours}
											</p>
										)}
										{(pharmacy.phone || pharmacy.email || pharmacy.website) && (
											<div className="space-y-1.5">
												{pharmacy.phone && (
													<p>
														<span className="text-foreground font-medium">Phone: </span>
														{pharmacy.phone}
													</p>
												)}
												{pharmacy.email && (
													<p>
														<span className="text-foreground font-medium">Email: </span>
														<a
															href={`mailto:${pharmacy.email}`}
															className="text-primary hover:underline"
														>
															{pharmacy.email}
														</a>
													</p>
												)}
												{pharmacy.website && (
													<p>
														<span className="text-foreground font-medium">Website: </span>
														<a
															href={pharmacy.website}
															target="_blank"
															rel="noopener noreferrer"
															className="text-primary hover:underline"
														>
															{pharmacy.website}
														</a>
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{pharmacy.description && (
					<Card className="animate-in fade-in slide-in-from-bottom-4 border-border/50 bg-card/50 fill-mode-both overflow-hidden shadow-sm backdrop-blur-sm transition-all delay-100 duration-300 hover:shadow-md">
						<CardContent className="p-6">
							<h2 className="text-xl font-semibold tracking-tight">About</h2>
							<p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
								{pharmacy.description}
							</p>
						</CardContent>
					</Card>
				)}

				<Card className="animate-in fade-in slide-in-from-bottom-4 border-border/50 bg-card/50 fill-mode-both overflow-hidden shadow-sm backdrop-blur-sm transition-all delay-150 duration-300 hover:shadow-md">
					<CardContent className="space-y-6 p-6">
						<h2 className="text-xl font-semibold tracking-tight">Products available here</h2>
						{productsAtPharmacy.length === 0 ? (
							<p className="text-muted-foreground mt-2 text-sm italic">No products listed.</p>
						) : (
							<PharmacyProductsClient products={productsAtPharmacy} pharmacyName={pharmacy.name} />
						)}
					</CardContent>
				</Card>

				<div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-200 duration-500">
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
