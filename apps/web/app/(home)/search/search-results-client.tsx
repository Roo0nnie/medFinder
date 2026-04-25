"use client"

import { useMemo, useState, type CSSProperties, type MouseEvent } from "react"

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/core/components/ui/carousel"
import { Card, CardContent } from "@/core/components/ui/card"
import { useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import { LandingRegisterModal } from "@/features/landing/components/landing-register-modal"
import type { LandingProduct, LandingProductVariant } from "@/features/landing/data/types"
import { cn } from "@/core/lib/utils"
import { ProductLocationFlowModal } from "@/features/products/components/product-branch-selection-modal"
import { getStockStatus } from "@/features/products/lib/stock-status"
import { recordProductSearchSelection } from "@/features/search/lib/record-product-search-selection"
import { ChevronDown, Package } from "lucide-react"

import type { ApiProduct } from "./page"

function landingVariantSlideUrls(
	product: LandingProduct,
	selectedVariant: LandingProductVariant | undefined
): string[] {
	if (selectedVariant) {
		const urls = selectedVariant.imageUrls?.filter(
			(u): u is string => typeof u === "string" && u.trim().length > 0
		)
		if (urls && urls.length > 0) return urls.map(u => u.trim())
		if (selectedVariant.imageUrl?.trim()) return [selectedVariant.imageUrl.trim()]
	}
	if (product.imageUrl?.trim()) return [product.imageUrl.trim()]
	return []
}

function LandingRatingRow({ rating }: { rating: number }) {
	const full = Math.min(5, Math.max(0, Math.round(rating)))
	return (
		<div
			className="flex items-center gap-1 text-amber-400"
			aria-label={`Rating ${rating.toFixed(1)} out of 5`}
		>
			{Array.from({ length: 5 }, (_, i) => (
				<span key={i} className={i < full ? "opacity-100" : "opacity-25"}>
					★
				</span>
			))}
			<span className="text-zinc-500 ml-1 text-xs tabular-nums dark:text-zinc-400">
				{rating.toFixed(1)}
			</span>
		</div>
	)
}

function apiProductToLanding(p: ApiProduct): LandingProduct {
	const firstVar = p.variants?.[0]
	const variants: LandingProductVariant[] | undefined =
		p.variants && p.variants.length > 0
			? p.variants.map(v => ({
					id: v.id,
					label: v.label,
					price: typeof v.price === "number" ? v.price : 0,
					quantity: typeof v.quantity === "number" ? v.quantity : 0,
					lowStockThreshold: typeof v.lowStockThreshold === "number" ? v.lowStockThreshold : 5,
					strength: v.strength ?? undefined,
					dosageForm: v.dosageForm ?? undefined,
					imageUrl: v.imageUrl ?? undefined,
					imageUrls: v.imageUrls ?? undefined,
				}))
			: undefined

	const fallbackVariant = variants?.[0]
	return {
		id: p.id,
		name: p.name,
		brand: (p.brandName ?? p.genericName ?? p.name) as string,
		brandId: p.brandId ?? undefined,
		brandName: p.brandName ?? undefined,
		genericName: p.genericName ?? undefined,
		strength: p.strength ?? firstVar?.strength ?? fallbackVariant?.strength ?? undefined,
		dosageForm: p.dosageForm ?? firstVar?.dosageForm ?? fallbackVariant?.dosageForm ?? undefined,
		category: "",
		description: p.description ?? "",
		price: fallbackVariant?.price ?? 0,
		quantity: fallbackVariant?.quantity ?? 0,
		supplier: "",
		storeId: p.pharmacyId ?? "",
		lowStockThreshold: 5,
		isAvailable: true,
		imageUrl: p.imageUrl ?? (firstVar?.imageUrl ?? fallbackVariant?.imageUrl) ?? undefined,
		rating: typeof p.rating === "number" ? p.rating : undefined,
		variants,
	}
}

function ProductCard({
	product,
	storeName,
	onSelectClick,
	onActivate,
	shellClassName,
	shellStyle,
}: {
	product: LandingProduct
	storeName: string
	onSelectClick?: (e: MouseEvent) => void
	/** Current variant id when the product has variants; null otherwise */
	onActivate?: (selectedVariantId: string | null) => void
	shellClassName?: string
	shellStyle?: CSSProperties
}) {
	const hasVariants = product.variants && product.variants.length > 0
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		hasVariants ? product.variants![0]!.id : null
	)

	const selectedVariant =
		hasVariants && selectedVariantId
			? product.variants!.find(x => x.id === selectedVariantId)
			: undefined

	const display = selectedVariant
		? {
				price: selectedVariant.price,
				quantity: selectedVariant.quantity,
				lowStockThreshold: selectedVariant.lowStockThreshold,
			}
		: {
				price: product.price,
				quantity: product.quantity,
				lowStockThreshold: product.lowStockThreshold,
			}

	const dosageDisplay = (() => {
		if (selectedVariant) {
			const strength = selectedVariant.strength?.trim()
			const form = selectedVariant.dosageForm?.trim()
			const parts = [strength, form].filter(Boolean)
			if (parts.length > 0) return parts.join(" · ")
		}
		const parts = [product.strength, product.dosageForm].filter(Boolean)
		return parts.length > 0 ? parts.join(" · ") : product.dosage
	})()

	const stock = getStockStatus({
		quantity: display.quantity,
		isAvailable: product.isAvailable !== false,
		lowStockThreshold: display.lowStockThreshold,
	})

	const activateVariantId = hasVariants ? selectedVariantId : null

	const slides = useMemo(
		() => landingVariantSlideUrls(product, selectedVariant),
		[product, selectedVariant]
	)

	const showRating = typeof product.rating === "number" && product.rating > 0

	const inner = (
		<Card className="hover:border-primary/20 flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
			<div className="bg-muted relative w-full shrink-0" style={{ paddingBottom: "100%" }}>
				<div className="absolute inset-0">
					{slides.length === 0 ? (
						<div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm">
							<Package className="h-10 w-10 opacity-40" aria-hidden />
							<span>No image</span>
						</div>
					) : slides.length === 1 ? (
						<img
							src={slides[0]}
							alt=""
							loading="lazy"
							decoding="async"
							className="object-contain"
							style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
						/>
					) : (
						<Carousel key={selectedVariantId ?? product.id} className="h-full w-full" opts={{ loop: true }}>
							<CarouselContent className="ml-0 h-full">
								{slides.map((url, i) => (
									<CarouselItem key={`${url}-${i}`} className="basis-full pl-0">
										<div className="relative w-full" style={{ paddingBottom: "100%" }}>
											<img
												src={url}
												alt=""
												loading="lazy"
												decoding="async"
												className="object-contain"
												style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
											/>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious
								type="button"
								className="left-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
								onClick={e => e.stopPropagation()}
							/>
							<CarouselNext
								type="button"
								className="right-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
								onClick={e => e.stopPropagation()}
							/>
						</Carousel>
					)}
				</div>

				<span
					className={cn(
						"absolute top-2 right-2 rounded-md px-2 py-0.5 text-xs font-medium shadow-sm backdrop-blur-sm",
						stock.kind === "not_for_sale" && "bg-background/90 text-muted-foreground",
						stock.kind === "out_of_stock" && "bg-destructive/90 text-destructive-foreground",
						stock.kind === "low_stock" && "bg-amber-500/90 text-amber-950",
						stock.kind === "in_stock" && "bg-primary/90 text-primary-foreground"
					)}
				>
					{stock.label}
				</span>
			</div>

			<CardContent className="bg-card text-card-foreground flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
				<div className="min-w-0 space-y-1">
					<h3 className="text-base leading-tight font-semibold">{product.name}</h3>
					<p className="text-muted-foreground text-sm">{product.brand}</p>
					{product.category ? (
						<p className="text-muted-foreground text-sm">Category: {product.category}</p>
					) : null}
				</div>

				{showRating ? <LandingRatingRow rating={product.rating!} /> : null}

				{dosageDisplay ? <p className="text-muted-foreground text-sm">Dosage: {dosageDisplay}</p> : null}
				{product.description ? (
					<p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
				) : null}

				{hasVariants ? (
					<div className="relative mt-1" onClick={onSelectClick}>
						<label htmlFor={`variant-${product.id}`} className="sr-only">
							Select size / variant
						</label>
						<select
							id={`variant-${product.id}`}
							value={selectedVariantId ?? ""}
							onChange={e => setSelectedVariantId(e.target.value || null)}
							onClick={e => e.stopPropagation()}
							className="border-input bg-background text-foreground focus:ring-ring w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-10 text-sm focus:ring-2 focus:outline-none"
						>
							{product.variants!.map(v => (
								<option key={v.id} value={v.id}>
									{v.label}
								</option>
							))}
						</select>
						<ChevronDown
							aria-hidden
							className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 opacity-70"
						/>
					</div>
				) : null}

				<div className="border-border mt-auto flex flex-col gap-2 border-t pt-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="text-lg font-semibold tabular-nums">₱{display.price.toFixed(2)}</span>
						<span
							className="bg-primary text-primary-foreground pointer-events-none inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium"
							aria-hidden
						>
							View availability
						</span>
					</div>
					<p className="text-muted-foreground truncate text-xs">{storeName}</p>
				</div>
			</CardContent>
		</Card>
	)

	if (!onActivate) return inner

	return (
		<div
			role="button"
			tabIndex={0}
			className={shellClassName}
			style={shellStyle}
			onClick={() => onActivate(activateVariantId)}
			onKeyDown={e => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					onActivate(activateVariantId)
				}
			}}
		>
			{inner}
		</div>
	)
}

export function SearchResultsClient({
	products,
	searchQuery,
	isCustomer,
}: {
	products: ApiProduct[]
	searchQuery: string
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

	const pharmacyById = useMemo(() => new Map(pharmacies.map(s => [s.id, s])), [pharmacies])

	const [modalOpen, setModalOpen] = useState(false)
	const [registerOpen, setRegisterOpen] = useState(false)
	const [selectedLanding, setSelectedLanding] = useState<LandingProduct | null>(null)

	const handleProductClick = (p: ApiProduct) => {
		recordProductSearchSelection({
			productId: p.id,
			pharmacyId: p.pharmacyId,
			searchQuery,
		})
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
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{products.map((p, i) => {
					const landing = mergedProducts.find(x => x.id === p.id) ?? apiProductToLanding(p)
					const storeName = landing.storeId
						? (pharmacyById.get(landing.storeId)?.name ?? "Unknown")
						: "View availability"
					return (
						<ProductCard
							key={p.id}
							product={landing}
							storeName={storeName}
							onSelectClick={e => e.stopPropagation()}
							shellClassName="focus-visible:ring-ring cursor-pointer rounded-xl outline-none focus-visible:ring-2"
							shellStyle={{ transitionDelay: `${Math.min(i, 7) * 80}ms` }}
							onActivate={() => handleProductClick(p)}
						/>
					)
				})}
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
