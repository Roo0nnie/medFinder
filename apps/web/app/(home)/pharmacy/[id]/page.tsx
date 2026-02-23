import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"
import { PharmacyDetailClient } from "./pharmacy-detail-client"

export default async function PharmacyPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession()
	if (!session || (session.user as { role?: string })?.role !== "customer") {
		redirect("/login")
	}

	const { id } = await params
	const pharmacy = landingPharmacies.find((p) => p.id === id)
	if (!pharmacy) notFound()

	const productsAtPharmacy = landingProducts.filter(
		(p) => p.storeId === pharmacy.id || p.availableAtStoreIds?.includes(pharmacy.id)
	)

	const mapUrl =
		pharmacy.latitude != null && pharmacy.longitude != null
			? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`
			: null

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{pharmacy.name}</h1>
					{pharmacy.whatIsThis && (
						<p className="text-muted-foreground mt-1 text-lg">{pharmacy.whatIsThis}</p>
					)}
					{pharmacy.rating != null && (
						<p className="text-muted-foreground mt-2 text-sm">
							Rating: {pharmacy.rating.toFixed(1)} / 5
						</p>
					)}
				</div>

				{pharmacy.description && (
					<Card>
						<CardContent className="p-6">
							<h2 className="text-lg font-semibold">About</h2>
							<p className="text-muted-foreground mt-2 whitespace-pre-wrap">{pharmacy.description}</p>
						</CardContent>
					</Card>
				)}

				{mapUrl && (
					<Card>
						<CardContent className="p-6">
							<h2 className="text-lg font-semibold">Location</h2>
							<p className="text-muted-foreground mt-1">
								{pharmacy.address}, {pharmacy.municipality}, {pharmacy.city}
							</p>
							<a
								href={mapUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-3 inline-flex"
							>
								<Button variant="outline" size="sm">
									Open in Google Maps
								</Button>
							</a>
						</CardContent>
					</Card>
				)}

				{(pharmacy.phone || pharmacy.email || pharmacy.website) && (
					<Card>
						<CardContent className="p-6">
							<h2 className="text-lg font-semibold">Contact</h2>
							<ul className="text-muted-foreground mt-2 space-y-1 text-sm">
								{pharmacy.phone && <li>Phone: {pharmacy.phone}</li>}
								{pharmacy.email && (
									<li>
										Email:{" "}
										<a
											href={`mailto:${pharmacy.email}`}
											className="text-primary hover:underline"
										>
											{pharmacy.email}
										</a>
									</li>
								)}
								{pharmacy.website && (
									<li>
										Website:{" "}
										<a
											href={pharmacy.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											{pharmacy.website}
										</a>
									</li>
								)}
							</ul>
							{pharmacy.operatingHours && (
								<p className="text-muted-foreground mt-3 text-sm">
									Hours: {pharmacy.operatingHours}
								</p>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardContent className="p-6">
						<h2 className="text-lg font-semibold">Products available here</h2>
						{productsAtPharmacy.length === 0 ? (
							<p className="text-muted-foreground mt-2 text-sm">No products listed.</p>
						) : (
							<ul className="mt-3 space-y-2">
								{productsAtPharmacy.map((p) => (
									<li key={p.id}>
										<Link
											href={`/product/${p.id}` as Route}
											className="text-primary hover:underline"
										>
											{p.name}
										</Link>
										<span className="text-muted-foreground ml-2 text-sm">
											₱{p.price.toFixed(2)} · {p.brand}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<PharmacyDetailClient pharmacyId={pharmacy.id} initialRating={pharmacy.rating} />
			</div>
		</div>
	)
}
