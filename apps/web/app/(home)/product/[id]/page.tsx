import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import { landingProducts } from "@/features/landing/data/products"
import { ProductDetailClient } from "./product-detail-client"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession()
	if (!session || (session.user as { role?: string })?.role !== "customer") {
		redirect("/login")
	}

	const { id } = await params
	const product = landingProducts.find((p) => p.id === id)
	if (!product) notFound()

	const pharmacyIds = product.availableAtStoreIds ?? [product.storeId]
	const pharmacies = pharmacyIds
		.map((sid) => landingPharmacies.find((p) => p.id === sid))
		.filter(Boolean) as typeof landingPharmacies

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="space-y-8">
				<div className="flex flex-col gap-6 sm:flex-row">
					{product.imageUrl && (
						<div className="relative flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 sm:h-64 sm:w-64">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={product.imageUrl}
								alt={product.name}
								className="max-h-full max-w-full object-contain"
							/>
						</div>
					)}
					<div className="min-w-0 flex-1">
						<h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
						<p className="text-muted-foreground mt-1 text-lg">{product.brand}</p>
						{product.rating != null && (
							<p className="text-muted-foreground mt-2 text-sm">
								Rating: {product.rating.toFixed(1)} / 5
							</p>
						)}
						{product.manufacturer && (
							<p className="text-muted-foreground mt-1 text-sm">
								Manufacturer: {product.manufacturer}
							</p>
						)}
						<p className="text-muted-foreground mt-2 text-2xl font-semibold">
							₱{product.price.toFixed(2)}
						</p>
						{product.category && (
							<p className="text-muted-foreground mt-1 text-sm">Category: {product.category}</p>
						)}
						{product.dosage && (
							<p className="text-muted-foreground mt-1 text-sm">Dosage: {product.dosage}</p>
						)}
					</div>
				</div>

				{product.description && (
					<Card>
						<CardContent className="p-6">
							<h2 className="text-lg font-semibold">Description</h2>
							<p className="text-muted-foreground mt-2 whitespace-pre-wrap">{product.description}</p>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardContent className="p-6">
						<h2 className="text-lg font-semibold">Available at</h2>
						{pharmacies.length === 0 ? (
							<p className="text-muted-foreground mt-2 text-sm">No pharmacies listed.</p>
						) : (
							<ul className="mt-3 space-y-2">
								{pharmacies.map((ph) => (
									<li key={ph.id}>
										<Link
											href={`/pharmacy/${ph.id}` as Route}
											className="text-primary hover:underline"
										>
											{ph.name}
										</Link>
										<span className="text-muted-foreground ml-2 text-sm">
											{ph.address}, {ph.city}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<ProductDetailClient productId={product.id} initialRating={product.rating} />
			</div>
		</div>
	)
}
