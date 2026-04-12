"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
	useProductBrandsAvailableQuery,
	useProductPharmaciesForBrandQuery,
	type ProductPharmacyForBrandRow,
} from "@/features/products/api/products.hooks"
import {
	brandKeyForProduct,
	brandLabelForProduct,
	getMedicineGroup,
} from "@/features/products/lib/group-products-by-medicine"

type BrandOption = {
	key: string
	label: string
	productId: string
	product: LandingProduct
	pharmacyCount?: number
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

function brandOptionHasSelectedVariantStock(
	opt: BrandOption,
	clickedProduct: LandingProduct,
	selectedVariantId: string | null | undefined,
	allProducts: LandingProduct[]
): boolean {
	if (!selectedVariantId) return true
	const selectedVar = clickedProduct.variants?.find(v => v.id === selectedVariantId)
	const catalogProduct =
		opt.productId === clickedProduct.id
			? clickedProduct
			: allProducts.find(p => p.id === opt.productId) ?? opt.product
	if (selectedVar?.label) {
		return (catalogProduct.variants ?? []).some(v => v.label === selectedVar.label && v.quantity > 0)
	}
	return (catalogProduct.variants ?? []).some(v => v.id === selectedVariantId && v.quantity > 0)
}

export type ProductLocationFlowModalProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	clickedProduct: LandingProduct | null
	allProducts: LandingProduct[]
	pharmacies: LandingPharmacy[]
	/**
	 * When set (e.g. variant chosen on the landing card), brand choices are limited to brands
	 * that stock that variant (API + catalog label match).
	 */
	selectedVariantId?: string | null
}

export function ProductLocationFlowModal({
	open,
	onOpenChange,
	clickedProduct,
	allProducts,
	pharmacies,
	selectedVariantId: selectedVariantIdProp = null,
}: ProductLocationFlowModalProps) {
	const router = useRouter()
	const [navTarget, setNavTarget] = useState<{
		brandId?: string
		brandName?: string
		brandLabel: string
	} | null>(null)
	const [navError, setNavError] = useState(false)
	const skipBrandAutoAdvanceRef = useRef(false)
	const singleBrandNavAttemptedRef = useRef(false)

	const pharmacyById = useMemo(() => new Map(pharmacies.map(p => [p.id, p])), [pharmacies])
	const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null)

	const catalogBrandOptions = useMemo((): BrandOption[] => {
		if (!clickedProduct) return []
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

	const skipBrandApi = catalogBrandOptions.length > 1 && !selectedVariantIdProp

	const brandsProductId = open && !skipBrandApi && clickedProduct?.id ? clickedProduct.id : undefined
	const { data: apiBrands, isLoading: brandsLoading, isFetching: brandsFetching } =
		useProductBrandsAvailableQuery(brandsProductId, {
			variantId: selectedVariantIdProp,
		})

	const mergedBrandOptionsRaw = useMemo((): BrandOption[] => {
		if (!clickedProduct) return []
		if (skipBrandApi) return catalogBrandOptions

		const byKey = new Map<string, BrandOption>()
		for (const o of catalogBrandOptions) {
			byKey.set(o.key, { ...o })
		}
		for (const row of apiBrands ?? []) {
			const key = row.brandId ? `id:${row.brandId}` : `lbl:${row.brandName}`
			const existing = byKey.get(key)
			const synth: LandingProduct = {
				...clickedProduct,
				id: row.productId,
				brandId: row.brandId ?? undefined,
				brandName: row.brandName,
				brand: row.brandName,
			}
			const label = brandLabelForProduct(synth)
			if (!existing) {
				byKey.set(key, {
					key,
					label,
					productId: row.productId,
					product: synth,
					pharmacyCount: row.pharmacyCount,
				})
			} else {
				byKey.set(key, {
					...existing,
					pharmacyCount: row.pharmacyCount ?? existing.pharmacyCount,
				})
			}
		}
		return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
	}, [clickedProduct, catalogBrandOptions, skipBrandApi, apiBrands])

	const mergedBrandOptions = useMemo(() => {
		if (!selectedVariantIdProp || !clickedProduct) return mergedBrandOptionsRaw
		return mergedBrandOptionsRaw.filter(o =>
			brandOptionHasSelectedVariantStock(o, clickedProduct, selectedVariantIdProp, allProducts)
		)
	}, [mergedBrandOptionsRaw, selectedVariantIdProp, clickedProduct, allProducts])

	const waitingForBrandApi = !skipBrandApi && (brandsLoading || brandsFetching) && apiBrands === undefined

	const resetState = useCallback(() => {
		setNavTarget(null)
		setNavError(false)
		skipBrandAutoAdvanceRef.current = false
		singleBrandNavAttemptedRef.current = false
	}, [])

	useEffect(() => {
		if (!open) {
			resetState()
		}
	}, [open, resetState])

	useEffect(() => {
		if (!open || !clickedProduct) return

		if (waitingForBrandApi) {
			return
		}

		if (skipBrandAutoAdvanceRef.current) {
			return
		}

		const n = mergedBrandOptions.length
		if (n === 1 && !singleBrandNavAttemptedRef.current) {
			singleBrandNavAttemptedRef.current = true
			const one = mergedBrandOptions[0]
			const p = one?.product ?? clickedProduct
			const bid = (p.brandId ?? "").trim()
			const bn = (p.brandName ?? "").trim()
			setNavTarget({
				brandId: bid || undefined,
				brandName: bid ? undefined : bn || undefined,
				brandLabel: one?.label ?? brandLabelForProduct(p),
			})
			setNavError(false)
		}
	}, [open, clickedProduct, mergedBrandOptions, waitingForBrandApi])

	useEffect(() => {
		if (!open || typeof window === "undefined") return
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			pos => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
			() => setUserPos(null),
			{ maximumAge: 60_000, timeout: 10_000 }
		)
	}, [open])

	const pharmaciesForNavQuery = useProductPharmaciesForBrandQuery(
		open && clickedProduct?.id && (navTarget?.brandId || navTarget?.brandName) ? clickedProduct.id : undefined,
		navTarget && (navTarget.brandId || navTarget.brandName)
			? { brandId: navTarget.brandId, brandName: navTarget.brandName }
			: undefined
	)

	const navigateToPharmacy = useCallback(
		(pharmacyId: string, productId: string, brandLabel: string) => {
			const params = new URLSearchParams()
			params.set("product", productId)
			if (brandLabel) params.set("brand", brandLabel)
			onOpenChange(false)
			router.push(`/pharmacy/${pharmacyId}?${params.toString()}` as Route)
		},
		[onOpenChange, router]
	)

	useEffect(() => {
		if (!open || !navTarget || !clickedProduct) return
		const q = pharmaciesForNavQuery
		if (q.isPending || q.isFetching) return
		if (q.isError) {
			setNavError(true)
			setNavTarget(null)
			return
		}
		if (!q.isSuccess) return
		const rows = q.data ?? []
		if (rows.length === 0) {
			setNavError(true)
			setNavTarget(null)
			return
		}
		setNavError(false)
		const sorted = sortPharmacyRowsForBrand(rows, pharmacyById, userPos)
		const first = sorted[0]
		if (!first) {
			setNavError(true)
			setNavTarget(null)
			return
		}
		navigateToPharmacy(first.pharmacyId, first.productId, navTarget.brandLabel)
		setNavTarget(null)
	}, [
		open,
		navTarget,
		clickedProduct,
		pharmaciesForNavQuery.isPending,
		pharmaciesForNavQuery.isFetching,
		pharmaciesForNavQuery.isError,
		pharmaciesForNavQuery.isSuccess,
		pharmaciesForNavQuery.data,
		pharmacyById,
		userPos,
		navigateToPharmacy,
	])

	const selectedVariantLabel = useMemo(() => {
		if (!selectedVariantIdProp || !clickedProduct?.variants?.length) return null
		return clickedProduct.variants.find(v => v.id === selectedVariantIdProp)?.label ?? null
	}, [selectedVariantIdProp, clickedProduct])

	if (!clickedProduct) return null

	const showBrandList = mergedBrandOptions.length > 1 || waitingForBrandApi
	const showNoBrands = !waitingForBrandApi && mergedBrandOptions.length === 0 && !navTarget

	const descriptionBase = selectedVariantLabel
		? `Choose a brand for ${clickedProduct.name} (${selectedVariantLabel}).`
		: `Choose a brand for ${clickedProduct.name}.`

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Select brand</DialogTitle>
					<DialogDescription>{descriptionBase}</DialogDescription>
				</DialogHeader>

				{navError && (
					<p className="text-destructive text-sm">No pharmacies available for this brand right now.</p>
				)}

				{showNoBrands && (
					<p className="text-muted-foreground text-sm">
						No brands with stock for this option. Try another size or check back later.
					</p>
				)}

				{showBrandList && (
					<div className="space-y-2">
						<p className="text-sm font-medium">Available brands</p>
						{waitingForBrandApi && (
							<p className="text-muted-foreground text-sm">Loading brands…</p>
						)}
						<ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
							{mergedBrandOptions.map(opt => (
								<li key={opt.key}>
									<button
										type="button"
										className="w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
										disabled={!!navTarget}
										onClick={() => {
											skipBrandAutoAdvanceRef.current = true
											singleBrandNavAttemptedRef.current = true
											setNavError(false)
											const bid = (opt.product.brandId ?? "").trim()
											const bn = (opt.product.brandName ?? "").trim()
											setNavTarget({
												brandId: bid || undefined,
												brandName: bid ? undefined : bn || undefined,
												brandLabel: opt.label,
											})
										}}
									>
										<span className="font-medium text-foreground">{opt.label}</span>
										<p className="text-muted-foreground mt-0.5 text-xs">
											{opt.pharmacyCount != null
												? `Available at ${opt.pharmacyCount} pharmacies`
												: `Stock (catalog): ${opt.product.quantity} total`}
										</p>
									</button>
								</li>
							))}
						</ul>
					</div>
				)}

				{mergedBrandOptions.length === 1 && (waitingForBrandApi || navTarget) && (
					<p className="text-muted-foreground text-sm">Finding a pharmacy…</p>
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

function sortPharmacyRowsForBrand(
	rows: ProductPharmacyForBrandRow[],
	pharmacyById: Map<string, LandingPharmacy>,
	userPos: { lat: number; lon: number } | null
): ProductPharmacyForBrandRow[] {
	const sorted = [...rows]
	if (userPos) {
		sorted.sort((a, b) => {
			const latA = a.latitude ?? pharmacyById.get(a.pharmacyId)?.latitude
			const lonA = a.longitude ?? pharmacyById.get(a.pharmacyId)?.longitude
			const latB = b.latitude ?? pharmacyById.get(b.pharmacyId)?.latitude
			const lonB = b.longitude ?? pharmacyById.get(b.pharmacyId)?.longitude
			const da =
				latA != null && lonA != null
					? haversineKm(userPos.lat, userPos.lon, latA, lonA)
					: Number.POSITIVE_INFINITY
			const db =
				latB != null && lonB != null
					? haversineKm(userPos.lat, userPos.lon, latB, lonB)
					: Number.POSITIVE_INFINITY
			return da - db
		})
	} else {
		sorted.sort((a, b) => a.pharmacyName.localeCompare(b.pharmacyName))
	}
	return sorted
}

/** @deprecated Use ProductLocationFlowModal — kept for any stray imports */
export const ProductBranchSelectionModal = ProductLocationFlowModal
