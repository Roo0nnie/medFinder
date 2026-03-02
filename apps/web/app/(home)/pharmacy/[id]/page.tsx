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
	const pharmacy = landingPharmacies.find(p => p.id === id)
	if (!pharmacy) notFound()

	const productsAtPharmacy = landingProducts.filter(
		p => p.storeId === pharmacy.id || p.availableAtStoreIds?.includes(pharmacy.id)
	)

	const hasCoordinates = pharmacy.latitude != null && pharmacy.longitude != null
	const mapUrl = hasCoordinates
		? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`
		: null
	const mapEmbedUrl = hasCoordinates
		? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}&output=embed`
		: null

	const { reviews, averageRating } = await getPharmacyReviews(pharmacy.id)
	const headerAverageRating =
		averageRating != null ? averageRating : pharmacy.rating != null ? pharmacy.rating : null
	const reviewCount = reviews.length

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="space-y-10">
				<section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
					{mapEmbedUrl && (
						<Card className="h-full">
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
									<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{pharmacy.name}</h1>
									{pharmacy.whatIsThis && (
										<p className="text-muted-foreground text-base sm:text-lg">
											{pharmacy.whatIsThis}
										</p>
									)}
								</div>
							</div>

							<div className="flex flex-col gap-4">
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

								<div className="bg-card/40 rounded-lg border p-4 text-sm">
									<div className="text-foreground font-medium">Pharmacy details</div>
									<div className="text-muted-foreground mt-2 space-y-1.5">
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
					<CardContent className="p-6">
						<h2 className="text-lg font-semibold">About</h2>
						<p className="text-muted-foreground mt-2 whitespace-pre-wrap">{pharmacy.description}</p>
					</CardContent>
				)}

				<Card>
					<CardContent className="space-y-4 p-6">
						<h2 className="text-lg font-semibold">Products available here</h2>
						{productsAtPharmacy.length === 0 ? (
							<p className="text-muted-foreground mt-1 text-sm">No products listed.</p>
						) : (
							<PharmacyProductsClient products={productsAtPharmacy} pharmacyName={pharmacy.name} />
						)}
					</CardContent>
				</Card>

				<PharmacyDetailClient
					pharmacyId={pharmacy.id}
					initialRating={pharmacy.rating}
					initialAverageRating={averageRating}
					initialReviews={reviews}
				/>
			</div>
		</div>
	)
}
