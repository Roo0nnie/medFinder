import type { Route } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { MapPinned } from "lucide-react"

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
	const product = landingProducts.find(p => p.id === id)
	if (!product) notFound()

	const pharmacyIds = product.availableAtStoreIds ?? [product.storeId]
	const pharmacies = pharmacyIds
		.map(sid => landingPharmacies.find(p => p.id === sid))
		.filter(Boolean) as typeof landingPharmacies

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
			<Link
				href={"/" as Route}
				className="text-muted-foreground hover:text-foreground mb-6 inline-block text-sm font-medium"
			>
				← Back to home
			</Link>

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
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
								<div className="mb-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
									{product.brand}
								</div>
								<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>

								<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
									{product.category && (
										<div>
											<span className="text-muted-foreground">Category: </span>
											<span className="font-medium text-foreground">{product.category}</span>
										</div>
									)}
									{product.dosage && (
										<div>
											<span className="text-muted-foreground">Dosage: </span>
											<span className="font-medium text-foreground">{product.dosage}</span>
										</div>
									)}
									{product.manufacturer && (
										<div>
											<span className="text-muted-foreground">Manufacturer: </span>
											<span className="font-medium text-foreground">{product.manufacturer}</span>
										</div>
									)}
								</div>
							</div>
							<div className="border-t pt-6">
								<p className="text-foreground text-3xl font-bold tracking-tight">
									₱{product.price.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{product.description && (
					<Card className="overflow-hidden border-border/50 bg-card/50 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
						<CardContent className="p-6">
							<h2 className="text-xl font-semibold tracking-tight">Description</h2>
							<p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
								{product.description}
							</p>
						</CardContent>
					</Card>
				)}

				<Card className="overflow-hidden border-border/50 bg-card/50 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
					<CardContent className="p-6">
						<h2 className="text-xl font-semibold tracking-tight">Available at</h2>
						{pharmacies.length === 0 ? (
							<p className="text-muted-foreground mt-3 text-sm">No pharmacies listed.</p>
						) : (
							<ul className="mt-4 space-y-3">
								{pharmacies.map(ph => (
									<li key={ph.id}>
										<Link
											href={`/pharmacy/${ph.id}` as Route}
											className="group flex flex-col gap-1 rounded-xl border border-transparent p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-muted/50 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="flex items-center gap-2">
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
													<MapPinned className="h-4 w-4" />
												</div>
												<span className="font-medium text-foreground transition-colors group-hover:text-primary">
													{ph.name}
												</span>
											</div>
											<span className="text-muted-foreground text-sm transition-colors group-hover:text-foreground">
												{ph.address}
												{ph.city && `, ${ph.city}`}
											</span>
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
