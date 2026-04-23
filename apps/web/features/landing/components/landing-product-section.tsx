"use client"

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/core/components/ui/carousel"
import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { useInView } from "@/core/hooks/use-in-view"
import { cn } from "@/core/lib/utils"
import { mapApiProductToLandingProduct, useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import { LandingRegisterModal } from "@/features/landing/components/landing-register-modal"
import type { LandingPharmacy, LandingProduct, LandingProductVariant } from "@/features/landing/data/types"
import { useProductSearchQuery, type Product } from "@/features/products/api/products.hooks"
import { ArrowUpDown, ChevronDown, Layers, MapPin, Package, Search, Store, Tag } from "lucide-react"
import {
	DEFAULT_PRODUCT_LIST_PAGE_SIZE,
	getStoredProductListPageSize,
	normalizeProductListPageSize,
	PAGE_SIZE_OPTIONS,
	PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY,
	setStoredProductListPageSize,
	type ProductListPageSize,
} from "@/features/products/lib/product-list-page-size"
import { getStockStatus } from "@/features/products/lib/stock-status"

const SORT_OPTIONS = [
	{ value: "relevance", label: "Relevance" },
	{ value: "name-asc", label: "Name A–Z" },
	{ value: "name-desc", label: "Name Z–A" },
	{ value: "price-asc", label: "Price low–high" },
	{ value: "price-desc", label: "Price high–low" },
] as const

const LANDING_SEARCH_DEBOUNCE_MS = 300
const MIN_LIVE_SEARCH_QUERY_LENGTH = 2

function brandOptionKey(p: LandingProduct): string {
	if (p.brandId) return `id:${p.brandId}`
	return `n:${encodeURIComponent(p.brand)}`
}

function brandOptionLabel(p: LandingProduct): string {
	const label = (p.brandName?.trim() || p.brand).trim()
	return label || "—"
}

function productMatchesBrandKey(p: LandingProduct, brandKey: string): boolean {
	return brandOptionKey(p) === brandKey
}

function filterProducts(
	products: LandingProduct[],
	pharmacies: LandingPharmacy[],
	query: string,
	category: string,
	brandKey: string,
	city: string,
	storeId: string,
	applyTextQuery: boolean
): LandingProduct[] {
	let result = products
	const q = query.trim().toLowerCase()
	if (applyTextQuery && q) {
		result = result.filter(
			p =>
				p.name.toLowerCase().includes(q) ||
				p.brand.toLowerCase().includes(q) ||
				(p.genericName ?? "").toLowerCase().includes(q) ||
				(p.brandName ?? "").toLowerCase().includes(q) ||
				(p.strength ?? "").toLowerCase().includes(q) ||
				(p.dosageForm ?? "").toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q)
		)
	}
	if (category) result = result.filter(p => p.category === category)
	if (brandKey) result = result.filter(p => productMatchesBrandKey(p, brandKey))
	if (city) {
		const storeIdsInCity = new Set(
			pharmacies.filter(s => s.city === city || s.municipality.includes(city)).map(s => s.id)
		)
		result = result.filter(p => storeIdsInCity.has(p.storeId))
	}
	if (storeId) result = result.filter(p => p.storeId === storeId)
	return result
}

function getSortPrice(p: LandingProduct): number {
	if (p.variants && p.variants.length > 0) {
		return Math.min(...p.variants.map(v => v.price))
	}
	return p.price
}

function pharmacyProductRoute(
	pharmacyId: string,
	productId: string,
	variantId: string | null
): Route {
	const q = new URLSearchParams({ product: productId })
	if (variantId) q.set("variant", variantId)
	return `/pharmacy/${pharmacyId}?${q.toString()}#pharmacy-products` as Route
}

function sortProducts(
	products: LandingProduct[],
	sort: (typeof SORT_OPTIONS)[number]["value"]
): LandingProduct[] {
	const copy = [...products]
	if (sort === "relevance") return copy
	if (sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name))
	else if (sort === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name))
	else if (sort === "price-asc") copy.sort((a, b) => getSortPrice(a) - getSortPrice(b))
	else if (sort === "price-desc") copy.sort((a, b) => getSortPrice(b) - getSortPrice(a))
	return copy
}

function mapSearchProductToLandingProduct(
	product: Product,
	categoryMap: Map<string, string>
): LandingProduct | null {
	return mapApiProductToLandingProduct(product as Record<string, unknown>, [], categoryMap)
}

/** Slides for the card gallery: imageUrls, else [imageUrl], else product image, else []. */
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
		return product.dosage
	})()

	const stock = getStockStatus({
		quantity: display.quantity,
		isAvailable: product.isAvailable !== false,
		lowStockThreshold: display.lowStockThreshold,
	})
	const stockLabel = stock.label

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
						<Carousel
							key={selectedVariantId ?? product.id}
							className="h-full w-full"
							opts={{ loop: true }}
						>
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
					{stockLabel}
				</span>
			</div>
			<CardContent className="bg-card text-card-foreground flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
				<div className="min-w-0 space-y-1">
					<h3 className="text-base leading-tight font-semibold">{product.name}</h3>
					<p className="text-muted-foreground text-sm">{product.brand}</p>
					<p className="text-muted-foreground text-sm">Category: {product.category}</p>
				</div>
				{showRating ? <LandingRatingRow rating={product.rating!} /> : null}
				{dosageDisplay && (
					<p className="text-muted-foreground text-sm">Dosage: {dosageDisplay}</p>
				)}
				{product.description && (
					<p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
				)}
				{hasVariants && (
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
				)}
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

export function LandingProductSection({ isCustomer = false }: { isCustomer?: boolean }) {
	const router = useRouter()
	const [query, setQuery] = useState("")
	const [debouncedQuery, setDebouncedQuery] = useState("")
	const [category, setCategory] = useState("")
	const [brandKey, setBrandKey] = useState("")
	const [city, setCity] = useState("")
	const [storeId, setStoreId] = useState("")
	const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("name-asc")
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<ProductListPageSize>(DEFAULT_PRODUCT_LIST_PAGE_SIZE)

	const { ref: headingRef, isInView: headingInView } = useInView<HTMLDivElement>()
	const { ref: gridRef, isInView: gridInView } = useInView<HTMLDivElement>({ threshold: 0.05 })

	const { data: catalog, isLoading: isCatalogLoading, isError: isCatalogError } = useLandingCatalog()
	const catalogProducts = useMemo(() => catalog?.products ?? [], [catalog?.products])
	const pharmacies = useMemo<LandingPharmacy[]>(() => catalog?.pharmacies ?? [], [catalog?.pharmacies])
	const catalogCategories = useMemo(() => catalog?.categories ?? [], [catalog?.categories])
	const categoryNameById = useMemo(
		() => new Map(catalogCategories.map(c => [c.id, c.name])),
		[catalogCategories]
	)

	useEffect(() => {
		const timeout = window.setTimeout(() => setDebouncedQuery(query), LANDING_SEARCH_DEBOUNCE_MS)
		return () => window.clearTimeout(timeout)
	}, [query])

	const normalizedQuery = query.trim()
	const normalizedDebouncedQuery = debouncedQuery.trim()
	const shouldUseLiveSearch = normalizedDebouncedQuery.length >= MIN_LIVE_SEARCH_QUERY_LENGTH

	const {
		data: liveSearchApiProducts,
		isLoading: isLiveSearchLoading,
		isFetching: isLiveSearchFetching,
		isError: isLiveSearchError,
	} = useProductSearchQuery(
		{
			query: normalizedDebouncedQuery,
			prefix: true,
			searchType: "plain",
		},
		{ enabled: shouldUseLiveSearch }
	)

	const liveSearchProducts = useMemo(() => {
		if (!shouldUseLiveSearch) return []
		return (liveSearchApiProducts ?? [])
			.map(product => mapSearchProductToLandingProduct(product, categoryNameById))
			.filter((product): product is LandingProduct => product !== null)
	}, [shouldUseLiveSearch, liveSearchApiProducts, categoryNameById])

	const useServerRankedProducts = shouldUseLiveSearch && !isLiveSearchError
	const products = useMemo(
		() => (useServerRankedProducts ? liveSearchProducts : catalogProducts),
		[useServerRankedProducts, liveSearchProducts, catalogProducts]
	)

	const isDebouncingSearch = normalizedQuery.length > 0 && normalizedQuery !== normalizedDebouncedQuery
	const showSearchLoading =
		useServerRankedProducts && (isDebouncingSearch || isLiveSearchLoading || isLiveSearchFetching)
	const hasApiError = isCatalogError || (shouldUseLiveSearch && isLiveSearchError)

	const pharmacyById = useMemo(() => new Map(pharmacies.map(s => [s.id, s])), [pharmacies])
	// When a store is selected, only show categories that belong to that owner and appear in that store's products
	const categories = useMemo(() => {
		if (storeId) {
			const ownerId = pharmacyById.get(storeId)?.ownerId
			if (!ownerId) {
				return Array.from(new Set(products.map(p => p.category))).sort()
			}
			const ownerCategoryNames = new Set(
				catalogCategories.filter(c => c.ownerId === ownerId).map(c => c.name)
			)
			const productCategoryNamesInStore = new Set(
				products.filter(p => p.storeId === storeId).map(p => p.category)
			)
			return Array.from(productCategoryNamesInStore)
				.filter(name => ownerCategoryNames.has(name))
				.sort()
		}
		return Array.from(new Set(products.map(p => p.category))).sort()
	}, [products, storeId, pharmacyById, catalogCategories])

	const brandSourceProducts = useMemo(
		() => (storeId ? products.filter(p => p.storeId === storeId) : products),
		[products, storeId]
	)
	const brandOptions = useMemo(() => {
		const map = new Map<string, string>()
		for (const p of brandSourceProducts) {
			const key = brandOptionKey(p)
			if (!map.has(key)) map.set(key, brandOptionLabel(p))
		}
		return Array.from(map.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((a, b) => a.label.localeCompare(b.label))
	}, [brandSourceProducts])

	const cities = useMemo(
		() =>
			Array.from(new Set(pharmacies.flatMap(s => [s.city, s.municipality].filter(Boolean)))).sort(),
		[pharmacies]
	)

	const filtered = useMemo(
		() => {
			const activeSort =
				sort === "relevance" && !useServerRankedProducts ? "name-asc" : sort
			return sortProducts(
				filterProducts(
					products,
					pharmacies,
					query,
					category,
					brandKey,
					city,
					storeId,
					!useServerRankedProducts
				),
				activeSort
			)
		},
		[
			products,
			pharmacies,
			query,
			category,
			brandKey,
			city,
			storeId,
			sort,
			useServerRankedProducts,
		]
	)

	const hasFilters = category || brandKey || city || storeId
	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
	const safePage = Math.min(page, totalPages)
	const paged = useMemo(() => {
		const start = (safePage - 1) * pageSize
		return filtered.slice(start, start + pageSize)
	}, [filtered, safePage, pageSize])

	useEffect(() => {
		setPage(1)
	}, [query, category, brandKey, city, storeId, sort])

	useEffect(() => {
		setPage(1)
	}, [pageSize])

	useEffect(() => {
		setPage(p => Math.min(p, totalPages))
	}, [totalPages])

	useEffect(() => {
		setPageSize(getStoredProductListPageSize())
		const onStorage = (e: StorageEvent) => {
			if (e.key !== PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY || e.newValue === null) return
			const n = Number.parseInt(e.newValue, 10)
			if (Number.isFinite(n)) setPageSize(normalizeProductListPageSize(n))
		}
		window.addEventListener("storage", onStorage)
		return () => window.removeEventListener("storage", onStorage)
	}, [])

	useEffect(() => {
		if (!brandKey) return
		if (!brandOptions.some(o => o.value === brandKey)) setBrandKey("")
	}, [brandKey, brandOptions])

	return (
		<div id="find-product" className="w-full space-y-6">
			<section
				ref={headingRef}
				className={`space-y-2 transition-all duration-700 ${headingInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
			>
				<h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
					Find medicines & medical supplies
				</h2>
				<p className="text-muted-foreground text-base sm:text-lg">
					Search by name, brand, or category. View availability and locate nearby pharmacies.
				</p>
			</section>

			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-md">
					<Search
						aria-hidden
						className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
					/>
					<Input
						type="search"
						placeholder="Search by name, brand, category..."
						value={query}
						onChange={e => {
							const nextQuery = e.target.value
							const nextIsLive = nextQuery.trim().length >= MIN_LIVE_SEARCH_QUERY_LENGTH
							const prevIsLive = query.trim().length >= MIN_LIVE_SEARCH_QUERY_LENGTH
							if (nextIsLive && !prevIsLive && sort !== "relevance") {
								setSort("relevance")
							}
							if (!nextIsLive && prevIsLive && sort === "relevance") {
								setSort("name-asc")
							}
							setQuery(nextQuery)
						}}
						onKeyDown={e => {
							if (e.key !== "Enter") return
							e.preventDefault()
							const q = query.trim()
							if (!q) return
							if (isCustomer) {
								router.push(`/search?q=${encodeURIComponent(q)}&prefix=true` as Route)
							} else {
								setRegisterModalOpen(true)
							}
						}}
						className="w-full pl-9"
						aria-label="Search products"
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2 sm:gap-3">
					<div className="relative">
						<ArrowUpDown
							aria-hidden
							className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						/>
						<select
							value={sort}
							onChange={e => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
							className="border-input bg-background text-foreground focus:ring-ring h-8 cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
							aria-label="Sort products"
						>
							{SORT_OPTIONS.map(o => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						<ChevronDown
							aria-hidden
							className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 opacity-70"
						/>
					</div>
					<label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
						<span>Per page</span>
						<span className="relative inline-block">
							<select
								value={String(pageSize)}
								onChange={e => {
									const v = Number(e.target.value) as ProductListPageSize
									setPageSize(v)
									setStoredProductListPageSize(v)
								}}
								className="border-input bg-background text-foreground focus:ring-ring h-8 w-full min-w-18 cursor-pointer appearance-none rounded-lg border py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
								aria-label="Products per page"
							>
								{PAGE_SIZE_OPTIONS.map(n => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
							<ChevronDown
								aria-hidden
								className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 opacity-70"
							/>
						</span>
					</label>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 sm:gap-4">
				<span className="text-muted-foreground w-full text-sm sm:w-auto">Filters:</span>
				<div className="relative min-w-0 flex-1 sm:min-w-[140px] sm:flex-none md:min-w-[160px]">
					<Layers
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2"
					/>
					<select
						value={category}
						onChange={e => setCategory(e.target.value)}
						className="border-input bg-background text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
						aria-label="Filter by category"
					>
						<option value="">All categories</option>
						{categories.map(c => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
					<ChevronDown
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 opacity-70"
					/>
				</div>
				<div className="relative min-w-0 flex-1 sm:min-w-[140px] sm:flex-none md:min-w-[160px]">
					<Tag
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2"
					/>
					<select
						value={brandKey}
						onChange={e => setBrandKey(e.target.value)}
						className="border-input bg-background text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
						aria-label="Filter by brand"
					>
						<option value="">All brands</option>
						{brandOptions.map(o => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
					<ChevronDown
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 opacity-70"
					/>
				</div>
				<div className="relative min-w-0 flex-1 sm:min-w-[160px] sm:flex-none md:min-w-[180px]">
					<MapPin
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2"
					/>
					<select
						value={city}
						onChange={e => setCity(e.target.value)}
						className="border-input bg-background text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
						aria-label="Filter by location"
					>
						<option value="">All locations</option>
						{cities.map(c => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
					<ChevronDown
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 opacity-70"
					/>
				</div>
				<div className="relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none md:min-w-[200px]">
					<Store
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2"
					/>
					<select
						value={storeId}
						onChange={e => setStoreId(e.target.value)}
						className="border-input bg-background text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
						aria-label="Filter by store"
					>
						<option value="">All stores</option>
						{pharmacies.map(pharmacy => (
							<option key={pharmacy.id} value={pharmacy.id}>
								{pharmacy.name}
							</option>
						))}
					</select>
					<ChevronDown
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 opacity-70"
					/>
				</div>
				{hasFilters && (
					<button
						type="button"
						onClick={() => {
							setCategory("")
							setBrandKey("")
							setCity("")
							setStoreId("")
						}}
						className="text-primary text-sm font-medium hover:underline"
					>
						Clear filters
					</button>
				)}
			</div>

			<p className="text-muted-foreground text-sm">
				{isCatalogLoading && catalogProducts.length === 0
					? "Loading real-time availability..."
					: showSearchLoading
						? "Searching products..."
						: `${filtered.length}${hasApiError ? " (API error)" : ""} result${filtered.length !== 1 ? "s" : ""}`}
			</p>

			{filtered.length === 0 ? (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<p className="text-foreground mb-1 font-medium">No products found</p>
					<p className="text-muted-foreground mb-4 text-sm">
						Try adjusting your search or filters to see more results.
					</p>
					<button
						type="button"
						onClick={() => {
							setQuery("")
							if (sort === "relevance") setSort("name-asc")
						}}
						className="text-primary text-sm font-medium hover:underline"
					>
						Clear search
					</button>
				</div>
			) : (
				<>
					<div
						ref={gridRef}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
					>
						{paged.map((product, i) => (
							<ProductCard
								key={product.id}
								product={product}
								storeName={pharmacyById.get(product.storeId)?.name ?? "Unknown"}
								onSelectClick={e => e.stopPropagation()}
								shellClassName={`focus-visible:ring-ring cursor-pointer rounded-xl transition-all duration-500 outline-none focus-visible:ring-2 ${
									gridInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-100"
								}`}
								shellStyle={{ transitionDelay: gridInView ? `${Math.min(i, 7) * 80}ms` : "0ms" }}
								onActivate={
									isCustomer
										? variantId => {
												router.push(
													pharmacyProductRoute(product.storeId, product.id, variantId)
												)
											}
										: () => setRegisterModalOpen(true)
								}
							/>
						))}
					</div>

					<div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
						<p className="text-muted-foreground text-sm">
							Page {safePage} of {totalPages}
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={safePage <= 1}
								className="border-input bg-background text-foreground inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
							>
								Prev
							</button>
							<button
								type="button"
								onClick={() => setPage(p => Math.min(totalPages, p + 1))}
								disabled={safePage >= totalPages}
								className="border-input bg-background text-foreground inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
							>
								Next
							</button>
						</div>
					</div>
				</>
			)}
			<LandingRegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />
		</div>
	)
}
