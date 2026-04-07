"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import type { LandingPharmacy, LandingProduct } from "@/features/landing/data/types"
import {
	brandKeyForProduct,
	brandLabelForProduct,
	getMedicineGroup,
} from "@/features/products/lib/group-products-by-medicine"

type AvailabilityRow = {
	pharmacyId: string
	pharmacyName: string
	address: string
	city: string
	price: number | string
	quantity?: number
}

type ProductDetailResponse = {
	availability?: AvailabilityRow[]
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
	const R = 6371
	const dLat = ((bLat - aLat) * Math.PI) / 180
	const dLon = ((bLon - aLon) * Math.PI) / 180
	const x =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

export type ProductLocationFlowModalProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	clickedProduct: LandingProduct | null
	allProducts: LandingProduct[]
	pharmacies: LandingPharmacy[]
}

/**
 * Brand-first flow: pick brand (product row), then pick pharmacy from product detail availability.
 */
export function ProductLocationFlowModal({
	open,
	onOpenChange,
	clickedProduct,
	allProducts,
	pharmacies,
}: ProductLocationFlowModalProps) {
	const router = useRouter()
	const [step, setStep] = useState<"brand" | "pharmacy">("brand")
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
	const [availability, setAvailability] = useState<AvailabilityRow[]>([])
	const [loadingDetail, setLoadingDetail] = useState(false)
	const [detailError, setDetailError] = useState<string | null>(null)
	const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null)

	const pharmacyById = useMemo(() => new Map(pharmacies.map(p => [p.id, p])), [pharmacies])

	const brandOptions = useMemo(() => {
		if (!clickedProduct) {
			return [] as {
				key: string
				label: string
				productId: string
				product: LandingProduct
			}[]
		}
		const group = getMedicineGroup(clickedProduct, allProducts)
		const byKey = new Map<string, LandingProduct>()
		for (const p of group) {
			const k = brandKeyForProduct(p)
			if (!byKey.has(k)) byKey.set(k, p)
		}
		return Array.from(byKey.entries()).map(([key, p]) => ({
			key,
			label: brandLabelForProduct(p),
			productId: p.id,
			product: p,
		}))
	}, [clickedProduct, allProducts])

	const resetState = useCallback(() => {
		setStep("brand")
		setSelectedProductId(null)
		setAvailability([])
		setDetailError(null)
		setLoadingDetail(false)
	}, [])

	useEffect(() => {
		if (!open) {
			resetState()
			return
		}
		if (!clickedProduct) return

		const group = getMedicineGroup(clickedProduct, allProducts)
		const byKey = new Map<string, LandingProduct>()
		for (const p of group) {
			const key = brandKeyForProduct(p)
			if (!byKey.has(key)) byKey.set(key, p)
		}
		if (byKey.size <= 1) {
			const first = [...byKey.values()][0]
			setSelectedProductId(first?.id ?? clickedProduct.id)
			setStep("pharmacy")
		} else {
			setStep("brand")
			setSelectedProductId(clickedProduct.id)
		}
	}, [open, clickedProduct, allProducts, resetState])

	useEffect(() => {
		if (!open || typeof window === "undefined") return
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			pos => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
			() => setUserPos(null),
			{ maximumAge: 60_000, timeout: 10_000 }
		)
	}, [open])

	useEffect(() => {
		if (!open || step !== "pharmacy" || !selectedProductId) return
		const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
		if (!apiBase) {
			setDetailError("API is not configured.")
			return
		}
		let cancelled = false
		setLoadingDetail(true)
		setDetailError(null)
		fetch(`${apiBase}/v1/products/${encodeURIComponent(selectedProductId)}/`, {
			credentials: "include",
			cache: "no-store",
		})
			.then(async res => {
				if (!res.ok) throw new Error(res.statusText)
				return res.json() as Promise<ProductDetailResponse>
			})
			.then(data => {
				if (cancelled) return
				setAvailability(data.availability ?? [])
			})
			.catch(() => {
				if (!cancelled) setDetailError("Could not load pharmacies for this product.")
			})
			.finally(() => {
				if (!cancelled) setLoadingDetail(false)
			})
		return () => {
			cancelled = true
		}
	}, [open, step, selectedProductId])

	const sortedAvailability = useMemo(() => {
		const rows = [...availability]
		if (userPos) {
			rows.sort((a, b) => {
				const pa = pharmacyById.get(a.pharmacyId)
				const pb = pharmacyById.get(b.pharmacyId)
				const da =
					pa?.latitude != null && pa?.longitude != null
						? haversineKm(userPos.lat, userPos.lon, pa.latitude, pa.longitude)
						: Number.POSITIVE_INFINITY
				const db =
					pb?.latitude != null && pb?.longitude != null
						? haversineKm(userPos.lat, userPos.lon, pb.latitude, pb.longitude)
						: Number.POSITIVE_INFINITY
				return da - db
			})
		} else {
			rows.sort((a, b) => a.pharmacyName.localeCompare(b.pharmacyName))
		}
		return rows
	}, [availability, pharmacyById, userPos])

	const selectedBrandLabel = useMemo(() => {
		if (!selectedProductId || !clickedProduct) return ""
		const p = allProducts.find(x => x.id === selectedProductId)
		return p ? brandLabelForProduct(p) : ""
	}, [selectedProductId, allProducts, clickedProduct])

	const navigateToPharmacy = (pharmacyId: string, productId: string, brandLabel: string) => {
		const params = new URLSearchParams()
		params.set("product", productId)
		if (brandLabel) params.set("brand", brandLabel)
		onOpenChange(false)
		router.push(`/pharmacy/${pharmacyId}?${params.toString()}` as Route)
	}

	if (!clickedProduct) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{step === "brand" ? "Select brand" : "Select pharmacy"}
					</DialogTitle>
					<DialogDescription>
						{step === "brand"
							? `Choose a brand for ${clickedProduct.name}, then pick a pharmacy.`
							: `Where would you like to view ${clickedProduct.name}${selectedBrandLabel ? ` (${selectedBrandLabel})` : ""}?`}
					</DialogDescription>
				</DialogHeader>

				{step === "brand" && brandOptions.length > 1 && (
					<div className="space-y-2">
						<p className="text-sm font-medium">Available brands</p>
						<ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
							{brandOptions.map(opt => (
								<li key={opt.key}>
									<button
										type="button"
										className="w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
										onClick={() => {
											setSelectedProductId(opt.productId)
											setStep("pharmacy")
										}}
									>
										<span className="font-medium text-foreground">{opt.label}</span>
										<p className="text-muted-foreground mt-0.5 text-xs">
											Stock (catalog): {opt.product.quantity} total
										</p>
									</button>
								</li>
							))}
						</ul>
					</div>
				)}

				{step === "pharmacy" && (
					<div className="space-y-3">
						{brandOptions.length > 1 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-0"
								onClick={() => setStep("brand")}
							>
								← Change brand
							</Button>
						)}
						{loadingDetail && (
							<p className="text-muted-foreground text-sm">Loading pharmacies…</p>
						)}
						{detailError && <p className="text-destructive text-sm">{detailError}</p>}
						{!loadingDetail && !detailError && sortedAvailability.length === 0 && (
							<p className="text-muted-foreground text-sm">
								No pharmacies currently list this product for sale. Try another brand or check back
								later.
							</p>
						)}
						{!loadingDetail && sortedAvailability.length > 0 && (
							<ul className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
								{sortedAvailability.map(row => {
									const ph = pharmacyById.get(row.pharmacyId)
									let distLabel: string | null = null
									if (userPos && ph?.latitude != null && ph?.longitude != null) {
										const km = haversineKm(userPos.lat, userPos.lon, ph.latitude, ph.longitude)
										distLabel = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
									}
									return (
										<li key={`${row.pharmacyId}-${row.price}`}>
											<button
												type="button"
												className="w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
												onClick={() =>
													navigateToPharmacy(
														row.pharmacyId,
														selectedProductId!,
														selectedBrandLabel
													)
												}
											>
												<p className="font-medium text-foreground">{row.pharmacyName}</p>
												<p className="text-muted-foreground">
													{[row.address, row.city].filter(Boolean).join(", ")}
												</p>
												<p className="text-muted-foreground mt-1 text-xs">
													₱{Number(row.price).toFixed(2)}
													{row.quantity != null ? ` · ${row.quantity} in stock` : ""}
													{distLabel ? ` · ~${distLabel} away` : ""}
												</p>
											</button>
										</li>
									)
								})}
							</ul>
						)}
					</div>
				)}

				<div className="flex justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

/** @deprecated Use ProductLocationFlowModal — kept for any stray imports */
export const ProductBranchSelectionModal = ProductLocationFlowModal
