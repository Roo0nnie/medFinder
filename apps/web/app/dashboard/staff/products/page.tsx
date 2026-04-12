"use client"

import { useState } from "react"
import {
	useProductCategoriesQuery,
	useProductDetailQuery,
	useProductsQuery,
	type Product,
} from "@/features/products/api/products.hooks"
import { StaffProductTable } from "@/features/products/components/staff-product-table"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function StaffProductsPage() {
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
	const { data: products, isLoading, isError } = useProductsQuery()
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: categories } = useProductCategoriesQuery()
	const { data: productDetail, isLoading: detailLoading } =
		useProductDetailQuery(selectedProductId ?? undefined)

	const productList: Product[] = products ?? []
	const pharmacyMap = new Map((pharmacies ?? []).map(p => [p.id, p.name]))

	return (
		<DashboardLayout role="staff">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Products from your owner&apos;s pharmacies. View-only.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<StaffProductTable
							products={productList}
							categories={categories}
							pharmacyMap={pharmacyMap}
							onView={prod => setSelectedProductId(prod.id)}
							isLoading={isLoading}
							isError={isError}
							errorMessage="Failed to load products from the API."
						/>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={selectedProductId !== null}
				onOpenChange={open => !open && setSelectedProductId(null)}
			>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Product details</DialogTitle>
					</DialogHeader>
					{detailLoading && selectedProductId && (
						<p className="text-muted-foreground py-4 text-sm">Loading details...</p>
					)}
					{!detailLoading && productDetail && (
						<div className="space-y-4 text-sm">
							<div className="grid gap-2 sm:grid-cols-2">
								<div>
									<span className="text-muted-foreground font-medium">Name</span>
									<p className="font-medium">{productDetail.name}</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Category</span>
									<p>{productDetail.category ?? "—"}</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Brand name</span>
									<p>{productDetail.brandName || "—"}</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Generic name</span>
									<p>{productDetail.genericName || "—"}</p>
								</div>
								<div className="sm:col-span-2">
									<span className="text-muted-foreground font-medium">Variants</span>
									{(productDetail.variants ?? []).length === 0 ? (
										<p>—</p>
									) : (
										<ul className="mt-1 list-inside list-disc space-y-1 text-sm">
											{(productDetail.variants ?? []).map(v => (
												<li key={v.id}>
													<span className="font-medium">{v.label}</span>
													{v.unit ? ` · ${v.unit}` : ""}
													{v.strength ? ` · ${v.strength}` : ""}
													{v.dosageForm ? ` · ${v.dosageForm}` : ""}
													{v.price != null && (
														<span className="text-muted-foreground">
															{" "}
															— ${Number(v.price).toFixed(2)}
															{v.quantity != null && ` (qty: ${v.quantity})`}
														</span>
													)}
												</li>
											))}
										</ul>
									)}
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Manufacturer</span>
									<p>{productDetail.manufacturer || "—"}</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Supplier</span>
									<p>{productDetail.supplier || "—"}</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">Requires prescription</span>
									<p>{productDetail.requiresPrescription ? "Yes" : "No"}</p>
								</div>
								{productDetail.priceFrom != null && (
									<div>
										<span className="text-muted-foreground font-medium">Price from</span>
										<p>${Number(productDetail.priceFrom).toFixed(2)}</p>
									</div>
								)}
							</div>
							{productDetail.description && (
								<div>
									<span className="text-muted-foreground font-medium">Description</span>
									<p className="mt-1">{productDetail.description}</p>
								</div>
							)}
							{productDetail.availability && productDetail.availability.length > 0 && (
								<div>
									<span className="text-muted-foreground font-medium">Available at</span>
									<ul className="mt-1 space-y-1">
										{productDetail.availability.map((a, i) => (
											<li key={`${a.pharmacyId}-${i}`} className="rounded border p-2">
												<span className="font-medium">{a.pharmacyName}</span>
												<p className="text-muted-foreground text-xs">
													{a.address}
													{a.city && `, ${a.city}`}
												</p>
												<p className="text-xs">
													${Number(a.price).toFixed(2)}
													{a.quantity != null && ` · Qty: ${a.quantity}`}
													{a.isAvailable ? "" : " · Unavailable"}
												</p>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
					{!detailLoading && selectedProductId && !productDetail && (
						<p className="text-destructive py-4 text-sm">Failed to load product details.</p>
					)}
				</DialogContent>
			</Dialog>
		</DashboardLayout>
	)
}
