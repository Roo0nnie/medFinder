"use client"

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type MouseEvent,
	type ReactNode,
} from "react"

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/core/components/ui/carousel"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { cn } from "@/core/lib/utils"
import type { LandingProduct, LandingProductVariant } from "@/features/landing/data/types"
import { ArrowUpDown, ChevronDown, Layers, Package, Tag } from "lucide-react"
import {
	DEFAULT_PRODUCT_LIST_PAGE_SIZE,
	getStoredProductListPageSize,
	normalizeProductListPageSize,
	PAGE_SIZE_OPTIONS,
	PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY,
	setStoredProductListPageSize,
	type ProductListPageSize,
} from "@/features/products/lib/product-list-page-size"
import { recordProductCatalogEngagement } from "@/features/landing/lib/product-engagement"
import { getStockStatus } from "@/features/products/lib/stock-status"

const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name A–Z" },
	{ value: "name-desc", label: "Name Z–A" },
	{ value: "price-asc", label: "Price low–high" },
	{ value: "price-desc", label: "Price high–low" },
] as const

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

function getSortPrice(p: LandingProduct): number {
	if (p.variants && p.variants.length > 0) {
		return Math.min(...p.variants.map(v => v.price))
	}
	return p.price
}

function sortProducts(
	products: LandingProduct[],
	sort: (typeof SORT_OPTIONS)[number]["value"]
): LandingProduct[] {
	const copy = [...products]
	if (sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name))
	else if (sort === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name))
	else if (sort === "price-asc") copy.sort((a, b) => getSortPrice(a) - getSortPrice(b))
	else if (sort === "price-desc") copy.sort((a, b) => getSortPrice(b) - getSortPrice(a))
	return copy
}

function filterProducts(
	products: LandingProduct[],
	query: string,
	category: string,
	brandKey: string
) {
	let result = products
	const q = query.trim().toLowerCase()
	if (q) {
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
	if (category) {
		result = result.filter(p => p.category === category)
	}
	if (brandKey) {
		result = result.filter(p => productMatchesBrandKey(p, brandKey))
	}
	return result
}

function PharmacyRatingRow({ rating }: { rating: number }) {
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
	pharmacyName,
	onSelectClick,
	onVariantChange,
	highlighted,
	initialVariantId,
}: {
	product: LandingProduct
	pharmacyName: string
	onSelectClick?: (e: MouseEvent) => void
	onVariantChange?: (variantId: string | null) => void
	highlighted?: boolean
	/** When set and valid for this product, pre-select this variant (e.g. deep link). */
	initialVariantId?: string
}) {
	const hasVariants = product.variants && product.variants.length > 0
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
		const variants = product.variants
		if (!variants?.length) return null
		if (initialVariantId && variants.some(v => v.id === initialVariantId)) return initialVariantId
		return variants[0]!.id
	})

	const selectedVariant =
		hasVariants && selectedVariantId
			? product.variants!.find(x => x.id === selectedVariantId)
			: undefined

	const unit =
		(selectedVariant?.unit ?? product.unit ?? "piece").trim() || "piece"

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

	const slides = useMemo(
		() => resolveSlideUrls(selectedVariant, product),
		[product, selectedVariant]
	)

	const showRating = typeof product.rating === "number" && product.rating > 0

	useEffect(() => {
		onVariantChange?.(selectedVariantId)
	}, [onVariantChange, selectedVariantId])

	return (
		<Card
			className={cn(
				"hover:border-primary/20 flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
				highlighted && "ring-primary ring-2 ring-offset-2 ring-offset-background"
			)}
		>
			<div className="bg-muted relative aspect-4/3 w-full shrink-0">
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
						className="h-full w-full object-cover"
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
									<img
										src={url}
										alt=""
										loading="lazy"
										decoding="async"
										className="aspect-4/3 h-full w-full object-cover"
									/>
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
				{showRating ? <PharmacyRatingRow rating={product.rating!} /> : null}
				{dosageDisplay ? (
					<p className="text-muted-foreground text-sm">Dosage: {dosageDisplay}</p>
				) : null}
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
				<p className="text-muted-foreground text-xs">
					{display.quantity} {unit}
					{display.quantity !== 1 ? "s" : ""} in stock at this pharmacy
				</p>
				<div className="border-border mt-auto flex flex-col gap-2 border-t pt-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="text-lg font-semibold tabular-nums">
							₱{(display.price ?? 0).toFixed(2)}
						</span>
						<span
							className="bg-primary text-primary-foreground pointer-events-none inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium"
							aria-hidden
						>
							View details
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

type ProductAvailabilityRow = {
	pharmacyId: string
	pharmacyName?: string
	address?: string
	city?: string
	price: number | string
	discountPrice?: number | string | null
	quantity: number
	isAvailable?: boolean
	variantId?: string | null
}

type ImageSource = {
	imageUrl?: string | null
	imageUrls?: string[] | null
}

function resolveSlideUrls(selected?: ImageSource | null, fallback?: ImageSource | null): string[] {
	const selectedUrls = selected?.imageUrls?.filter(
		(u): u is string => typeof u === "string" && u.trim().length > 0
	)
	if (selectedUrls && selectedUrls.length > 0) return selectedUrls.map(u => u.trim())
	if (selected?.imageUrl?.trim()) return [selected.imageUrl.trim()]

	const fallbackUrls = fallback?.imageUrls?.filter(
		(u): u is string => typeof u === "string" && u.trim().length > 0
	)
	if (fallbackUrls && fallbackUrls.length > 0) return fallbackUrls.map(u => u.trim())
	if (fallback?.imageUrl?.trim()) return [fallback.imageUrl.trim()]

	return []
}

type ProductDetailVariant = {
	id: string
	label: string
	unit?: string | null
	strength?: string | null
	dosageForm?: string | null
	imageUrl?: string | null
	imageUrls?: string[] | null
	availability?: ProductAvailabilityRow[]
	price?: number | null
	quantity?: number | null
	lowStockThreshold?: number | null
}

type ProductDetailResponse = ImageSource & {
	id: string
	pharmacyId?: string | null
	name: string
	description?: string | null
	brandId?: string | null
	brandName?: string | null
	genericName?: string | null
	manufacturer?: string | null
	supplier?: string | null
	categoryId?: string
	category?: string | null
	requiresPrescription?: boolean
	lowStockThreshold?: number | null
	createdAt?: string
	updatedAt?: string
	priceFrom?: number | null
	variants?: ProductDetailVariant[]
	availability?: ProductAvailabilityRow[]
}

function formatDetailDate(iso: string | undefined): string | null {
	if (!iso) return null
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return null
	return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function ModalDetailRow({
	label,
	children,
}: {
	label: string
	children: ReactNode
}) {
	if (children == null || children === "") return null
	return (
		<div className="grid gap-1 text-sm sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-start sm:gap-3">
			<div className="text-muted-foreground">{label}</div>
			<div className="min-w-0 wrap-break-word text-foreground">{children}</div>
		</div>
	)
}

export function PharmacyProductsClient({
	products,
	pharmacyName,
	pharmacyId,
	initialProductId,
	initialBrandName,
	initialVariantId,
}: {
	products: LandingProduct[]
	pharmacyName: string
	pharmacyId: string
	initialProductId?: string
	initialBrandName?: string
	initialVariantId?: string
}) {
	const [query, setQuery] = useState("")
	const [category, setCategory] = useState("")
	const [brandKey, setBrandKey] = useState("")
	const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("name-asc")
	const [modalOpen, setModalOpen] = useState(false)
	const [activeProduct, setActiveProduct] = useState<ProductDetailResponse | null>(null)
	const [selectedVariantId, setSelectedVariantId] = useState<string>("")
	const [selectedCardVariants, setSelectedCardVariants] = useState<
		Record<string, string | null | undefined>
	>({})
	const [deepLinkOnly, setDeepLinkOnly] = useState(() => Boolean(initialProductId))
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<ProductListPageSize>(DEFAULT_PRODUCT_LIST_PAGE_SIZE)
	const highlightedRef = useRef<HTMLDivElement>(null)

	const categories = useMemo(
		() => Array.from(new Set(products.map(p => p.category))).sort(),
		[products]
	)

	const brandOptions = useMemo(() => {
		const map = new Map<string, string>()
		for (const p of products) {
			const key = brandOptionKey(p)
			if (!map.has(key)) map.set(key, brandOptionLabel(p))
		}
		return Array.from(map.entries())
			.map(([value, label]) => ({ value, label }))
			.sort((a, b) => a.label.localeCompare(b.label))
	}, [products])

	const baseProducts = useMemo(() => {
		if (deepLinkOnly && initialProductId) {
			return products.filter(p => p.id === initialProductId)
		}
		return products
	}, [products, deepLinkOnly, initialProductId])

	const filtered = useMemo(
		() => sortProducts(filterProducts(baseProducts, query, category, brandKey), sort),
		[baseProducts, query, category, brandKey, sort]
	)

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
	const safePage = Math.min(page, totalPages)
	const paged = useMemo(() => {
		const start = (safePage - 1) * pageSize
		return filtered.slice(start, start + pageSize)
	}, [filtered, safePage, pageSize])

	useEffect(() => {
		setPage(1)
	}, [query, category, brandKey, sort, deepLinkOnly])

	useEffect(() => {
		setPage(1)
	}, [pageSize])

	useEffect(() => {
		setPage(p => Math.min(p, totalPages))
	}, [totalPages])

	useEffect(() => {
		setPageSize(getStoredProductListPageSize())
		const onStorage = (e: StorageEvent) => {
			if (e.key !== PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY || e.newValue == null) return
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

	const activeListProduct = useMemo(
		() => products.find(product => product.id === activeProduct?.id) ?? null,
		[products, activeProduct?.id]
	)

	const openProductModal = useCallback(async (productId: string, variantId?: string | null) => {
		const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
		if (!apiBase) return
		try {
			const res = await fetch(`${apiBase}/v1/products/${productId}/`, {
				credentials: "include",
				cache: "no-store",
			})
			if (!res.ok) return
			const detail = (await res.json()) as ProductDetailResponse
			const resolvedVariantId =
				variantId && detail.variants?.some(variant => variant.id === variantId)
					? variantId
					: detail.variants?.[0]?.id ?? ""
			setActiveProduct(detail)
			setSelectedVariantId(resolvedVariantId)
			setModalOpen(true)
			recordProductCatalogEngagement(productId)
		} catch {
			// no-op
		}
	}, [])

	useEffect(() => {
		if (!initialProductId) return
		const t = window.setTimeout(() => {
			highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
		}, 300)
		return () => window.clearTimeout(t)
	}, [initialProductId])

	const selectedVariantView = useMemo(() => {
		const list = activeProduct?.variants
		if (!list?.length) return null
		const found = list.find(v => v.id === selectedVariantId)
		return found ?? list[0] ?? null
	}, [activeProduct, selectedVariantId])

	const pharmacyRowForModal = useMemo(() => {
		if (!activeProduct) return null
		const pid = pharmacyId

		if (selectedVariantView) {
			const fromVariant = selectedVariantView.availability?.find(a => a.pharmacyId === pid)
			if (fromVariant) return fromVariant
			return (
				activeProduct.availability?.find(
					a =>
						a.pharmacyId === pid &&
						(a.variantId === selectedVariantView.id ||
							a.variantId == null ||
							a.variantId === "")
				) ?? null
			)
		}

		return activeProduct.availability?.find(a => a.pharmacyId === pid) ?? null
	}, [activeProduct, pharmacyId, selectedVariantView])

	const modalStockStatus = useMemo(() => {
		if (!pharmacyRowForModal || !activeProduct) return null
		const low = selectedVariantView?.lowStockThreshold ?? activeProduct.lowStockThreshold ?? 5
		return getStockStatus({
			quantity: pharmacyRowForModal.quantity,
			isAvailable: pharmacyRowForModal.isAvailable !== false,
			lowStockThreshold: typeof low === "number" ? low : 5,
		})
	}, [pharmacyRowForModal, selectedVariantView, activeProduct])

	const modalSlides = useMemo(
		() => resolveSlideUrls(selectedVariantView, activeProduct ?? activeListProduct),
		[selectedVariantView, activeProduct, activeListProduct]
	)

	return (
		<div className="space-y-4">
			{initialProductId && deepLinkOnly && (
				<div className="bg-muted/50 flex flex-col gap-2 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm">
						Showing selected product
						{initialBrandName ? (
							<>
								{" "}
								<span className="font-medium">({initialBrandName})</span>
							</>
						) : null}
						.
					</p>
					<button
						type="button"
						className="text-primary text-sm font-medium hover:underline"
						onClick={() => {
							setDeepLinkOnly(false)
							setQuery("")
							setCategory("")
							setBrandKey("")
						}}
					>
						Show all products
					</button>
				</div>
			)}
			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<Input
					type="search"
					placeholder="Search by name, brand, category..."
					value={query}
					onChange={e => setQuery(e.target.value)}
					className="w-full sm:max-w-md"
					aria-label="Search products in this pharmacy"
				/>
				<div className="flex flex-wrap items-center gap-2 sm:gap-3">
					<div className="relative">
						<ArrowUpDown
							aria-hidden
							className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						/>
						<select
							value={sort}
							onChange={e => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
							className="border-input text-foreground focus:ring-ring h-8 cursor-pointer appearance-none rounded-lg border bg-transparent py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none"
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
								className="border-input text-foreground focus:ring-ring h-8 w-full min-w-18 cursor-pointer appearance-none rounded-lg border bg-transparent py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:outline-none"
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
				<span className="text-muted-foreground w-full text-sm sm:w-auto">Filter by:</span>
				<div className="relative min-w-0 flex-1 sm:min-w-[140px] sm:flex-none md:min-w-[160px]">
					<Layers
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2"
					/>
					<select
						value={category}
						onChange={e => setCategory(e.target.value)}
						className="border-input text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border bg-transparent py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none"
					>
						<option key="__all__" value="">
							All categories
						</option>
						{categories.map((c, i) => (
							<option key={c ? `${c}-${i}` : `category-${i}`} value={c}>
								{c || "Uncategorized"}
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
						className="border-input text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border bg-transparent py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none"
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
			</div>

			<p className="text-muted-foreground text-sm">
				{filtered.length} result{filtered.length !== 1 ? "s" : ""} in {pharmacyName}
			</p>

			{filtered.length === 0 ? (
				<div className="border-border bg-card/50 rounded-2xl border px-6 py-16 text-center shadow-sm backdrop-blur-sm">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground mb-4">
						<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<p className="text-foreground mb-2 text-lg font-semibold tracking-tight">No products found</p>
					<p className="text-muted-foreground mb-6 text-sm">
						We couldn't find anything matching your search.
					</p>
					<button
						type="button"
						onClick={() => {
							setQuery("")
							setCategory("")
							setBrandKey("")
						}}
						className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
					>
						Clear filters
					</button>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{paged.map((product, i) => (
							<div
								key={product.id}
								ref={initialProductId === product.id ? highlightedRef : undefined}
								role="button"
								tabIndex={0}
								className="animate-in fade-in slide-in-from-bottom-4 focus-visible:ring-ring cursor-pointer rounded-xl outline-none focus-visible:ring-2"
								style={{ animationDelay: `${Math.min(i * 50, 500)}ms`, animationFillMode: "both" }}
									onClick={() => {
										void openProductModal(
											product.id,
											selectedCardVariants[product.id] ??
												(initialProductId === product.id ? initialVariantId : undefined)
										)
									}}
									onKeyDown={e => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault()
											void openProductModal(
												product.id,
												selectedCardVariants[product.id] ??
													(initialProductId === product.id ? initialVariantId : undefined)
											)
										}
									}}
								>
									<ProductCard
										product={product}
										pharmacyName={pharmacyName}
										onSelectClick={e => e.stopPropagation()}
										onVariantChange={variantId => {
											setSelectedCardVariants(current => {
												if (current[product.id] === variantId) return current
												return { ...current, [product.id]: variantId }
											})
										}}
										highlighted={initialProductId === product.id}
										initialVariantId={
											initialProductId === product.id ? initialVariantId : undefined
									}
								/>
							</div>
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

			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="flex max-h-[min(90vh,880px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
					<div className="max-h-[min(90vh,880px)] overflow-y-auto">
						{activeProduct && (
							<>
								<div className="bg-muted w-full shrink-0 overflow-hidden border-b">
									<div className="relative flex h-[clamp(220px,38vh,320px)] w-full items-center justify-center overflow-hidden p-3 sm:h-[clamp(240px,36vh,300px)] sm:p-4">
										{modalSlides.length === 0 ? (
											<div className="text-muted-foreground flex min-h-[100px] w-full flex-col items-center justify-center gap-2 py-6 text-sm">
												<Package className="h-12 w-12 opacity-40" aria-hidden />
												<span>No image</span>
											</div>
										) : modalSlides.length === 1 ? (
											<img
												src={modalSlides[0]}
												alt=""
												className="block h-full w-full max-h-full max-w-full object-contain object-center"
											/>
										) : (
											<div className="relative h-full w-full overflow-hidden">
												<Carousel
													key={selectedVariantId || activeProduct.id}
													className="h-full w-full"
													opts={{ loop: true }}
												>
													<CarouselContent className="ml-0 h-full">
														{modalSlides.map((url, i) => (
															<CarouselItem key={`${url}-${i}`} className="basis-full pl-0">
																<div className="flex h-full w-full items-center justify-center overflow-hidden">
																	<img
																		src={url}
																		alt=""
																		className="block h-full w-full max-h-full max-w-full object-contain object-center"
																	/>
																</div>
															</CarouselItem>
														))}
													</CarouselContent>
													<CarouselPrevious
														type="button"
														className="left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
													/>
													<CarouselNext
														type="button"
														className="right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
													/>
												</Carousel>
											</div>
										)}
									</div>
								</div>

								<div className="space-y-4 p-6 pt-5">
									<DialogHeader className="space-y-2 text-left">
										<DialogTitle className="text-xl font-semibold tracking-tight">
											{activeProduct.name}
										</DialogTitle>
										<DialogDescription>
											Availability and pricing at{" "}
											<span className="text-foreground font-medium">{pharmacyName}</span>.
										</DialogDescription>
									</DialogHeader>

									<div className="space-y-3">
										<ModalDetailRow label="Brand">{activeProduct.brandName}</ModalDetailRow>
										<ModalDetailRow label="Generic name">{activeProduct.genericName}</ModalDetailRow>
										<ModalDetailRow label="Category">{activeProduct.category}</ModalDetailRow>
										<ModalDetailRow label="Manufacturer">{activeProduct.manufacturer}</ModalDetailRow>
										<ModalDetailRow label="Supplier">{activeProduct.supplier}</ModalDetailRow>
										{activeProduct.requiresPrescription != null ? (
											<ModalDetailRow label="Prescription">
												{activeProduct.requiresPrescription ? "Required" : "Not required"}
											</ModalDetailRow>
										) : null}
										{(() => {
											const created = formatDetailDate(activeProduct.createdAt)
											const updated = formatDetailDate(activeProduct.updatedAt)
											if (!created && !updated) return null
											const parts: string[] = []
											if (created) parts.push(`Added ${created}`)
											if (updated && updated !== created) parts.push(`Updated ${updated}`)
											return (
												<ModalDetailRow label="Record">
													<span className="text-muted-foreground">{parts.join(" · ")}</span>
												</ModalDetailRow>
											)
										})()}
									</div>

									{(activeProduct.variants ?? []).length > 0 ? (
										<div className="space-y-2">
											<label htmlFor="pharmacy-product-variant" className="text-sm font-medium">
												Variant
											</label>
											<div className="relative">
												<select
													id="pharmacy-product-variant"
													value={selectedVariantId}
													onChange={e => setSelectedVariantId(e.target.value)}
													className="border-input text-foreground focus:ring-ring h-9 w-full cursor-pointer appearance-none rounded-lg border bg-transparent pl-3 pr-10 text-sm focus:ring-2 focus:outline-none"
												>
													{activeProduct.variants?.map(v => (
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
										</div>
									) : null}

									{selectedVariantView ? (
										<div className="bg-muted/40 space-y-3 rounded-lg border p-4">
											<p className="text-sm font-medium">Selected variant</p>
											<div className="space-y-2">
												<ModalDetailRow label="Label">{selectedVariantView.label}</ModalDetailRow>
												<ModalDetailRow label="Unit">{selectedVariantView.unit}</ModalDetailRow>
												<ModalDetailRow label="Strength">{selectedVariantView.strength}</ModalDetailRow>
												<ModalDetailRow label="Dosage form">
													{selectedVariantView.dosageForm}
												</ModalDetailRow>
											</div>
										</div>
									) : null}

									{activeProduct.description ? (
										<div className="space-y-1">
											<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
												Description
											</p>
											<p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
												{activeProduct.description}
											</p>
										</div>
									) : null}

									<div className="border-t pt-4">
										<p className="mb-3 text-sm font-medium">At this pharmacy</p>
										{pharmacyRowForModal ? (
											<div className="space-y-3">
												<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
													{pharmacyRowForModal.discountPrice != null &&
													Number(pharmacyRowForModal.discountPrice) !==
														Number(pharmacyRowForModal.price) ? (
														<>
															<span className="text-muted-foreground text-lg line-through tabular-nums">
																₱{Number(pharmacyRowForModal.price).toFixed(2)}
															</span>
															<span className="text-foreground text-2xl font-semibold tabular-nums">
																₱{Number(pharmacyRowForModal.discountPrice).toFixed(2)}
															</span>
															<span className="text-muted-foreground text-xs">Sale price</span>
														</>
													) : (
														<span className="text-foreground text-2xl font-semibold tabular-nums">
															₱{Number(pharmacyRowForModal.price).toFixed(2)}
														</span>
													)}
												</div>
												<div className="flex flex-wrap items-center gap-2 text-sm">
													<span className="text-muted-foreground">Stock:</span>
													<span className="tabular-nums">{pharmacyRowForModal.quantity}</span>
													{modalStockStatus ? (
														<span
															className={cn(
																"rounded-md px-2 py-0.5 text-xs font-medium",
																modalStockStatus.kind === "not_for_sale" &&
																	"bg-muted text-muted-foreground",
																modalStockStatus.kind === "out_of_stock" &&
																	"bg-destructive/15 text-destructive",
																modalStockStatus.kind === "low_stock" &&
																	"bg-amber-500/15 text-amber-900 dark:text-amber-100",
																modalStockStatus.kind === "in_stock" &&
																	"bg-primary/15 text-primary"
															)}
														>
															{modalStockStatus.label}
														</span>
													) : null}
												</div>
											</div>
										) : (
											<p className="text-muted-foreground text-sm">
												This item is not listed for {pharmacyName} for the selected variant.
											</p>
										)}
									</div>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

