"use client"

import { useMemo, useState } from "react"

import { Card, CardContent } from "@/core/components/ui/card"
import { useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import { LandingRegisterModal } from "@/features/landing/components/landing-register-modal"
import type { LandingProduct } from "@/features/landing/data/types"
import { ProductLocationFlowModal } from "@/features/products/components/product-branch-selection-modal"

import type { ApiProduct } from "./page"

function apiProductToLanding(p: ApiProduct): LandingProduct {
	const firstVar = p.variants?.[0]
	return {
		id: p.id,
		name: p.name,
		brand: (p.brandName ?? p.genericName ?? p.name) as string,
		brandId: p.brandId ?? undefined,
		brandName: p.brandName ?? undefined,
		genericName: p.genericName ?? undefined,
		strength: p.strength ?? firstVar?.strength ?? undefined,
		dosageForm: p.dosageForm ?? firstVar?.dosageForm ?? undefined,
		category: "",
		description: p.description ?? "",
		price: 0,
		quantity: 0,
		supplier: "",
		storeId: "",
		lowStockThreshold: 5,
		isAvailable: true,
	}
}

export function SearchResultsClient({
	products,
	isCustomer,
}: {
	products: ApiProduct[]
	isCustomer: boolean
}) {
	const { data: catalog } = useLandingCatalog()
	const allFromCatalog = catalog?.products ?? []
	const pharmacies = catalog?.pharmacies ?? []

	const mergedProducts = useMemo(() => {
		const map = new Map<string, LandingProduct>(allFromCatalog.map(p => [p.id, p]))
		for (const p of products) {
			const l = apiProductToLanding(p)
			if (!map.has(l.id)) map.set(l.id, l)
		}
		return Array.from(map.values())
	}, [allFromCatalog, products])

	const [modalOpen, setModalOpen] = useState(false)
	const [registerOpen, setRegisterOpen] = useState(false)
	const [selectedLanding, setSelectedLanding] = useState<LandingProduct | null>(null)

	const handleProductClick = (p: ApiProduct) => {
		if (!isCustomer) {
			setRegisterOpen(true)
			return
		}
		const landing = mergedProducts.find(x => x.id === p.id) ?? apiProductToLanding(p)
		setSelectedLanding(landing)
		setModalOpen(true)
	}

	return (
		<>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{products.map(p => (
					<button
						key={p.id}
						type="button"
						onClick={() => handleProductClick(p)}
						className="block text-left"
					>
						<Card className="hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
							<CardContent className="p-4 sm:p-5">
								<div className="min-w-0">
									<h3 className="text-foreground line-clamp-2 text-base font-semibold">{p.name}</h3>
									{(p.brandName || p.genericName) && (
										<p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
											{p.brandName ?? p.genericName}
										</p>
									)}
									{(p.dosageForm || p.strength) && (
										<p className="text-muted-foreground mt-2 text-sm">
											{[p.dosageForm, p.strength].filter(Boolean).join(" • ")}
										</p>
									)}
									{p.description && (
										<p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
											{p.description}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</button>
				))}
			</div>

			<LandingRegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
			{selectedLanding && (
				<ProductLocationFlowModal
					open={modalOpen}
					onOpenChange={setModalOpen}
					clickedProduct={selectedLanding}
					allProducts={mergedProducts}
					pharmacies={pharmacies}
				/>
			)}
		</>
	)
}
