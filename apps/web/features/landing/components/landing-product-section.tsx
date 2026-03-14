"use client"

import { useMemo, useState } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { useInView } from "@/core/hooks/use-in-view"
import { cn } from "@/core/lib/utils"
import { useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import type { LandingPharmacy, LandingProduct } from "@/features/landing/data/types"

import { LandingRegisterModal } from "./landing-register-modal"

const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name A–Z" },
	{ value: "name-desc", label: "Name Z–A" },
	{ value: "price-asc", label: "Price low–high" },
	{ value: "price-desc", label: "Price high–low" },
] as const

function filterProducts(
	products: LandingProduct[],
	pharmacies: LandingPharmacy[],
	query: string,
	category: string,
	city: string,
	storeId: string
): LandingProduct[] {
	let result = products
	const q = query.trim().toLowerCase()
	if (q) {
		result = result.filter(
			p =>
				p.name.toLowerCase().includes(q) ||
				p.brand.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q)
		)
	}
	if (category) result = result.filter(p => p.category === category)
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

function ProductCard({
	product,
	storeName,
	onSelectClick,
}: {
	product: LandingProduct
	storeName: string
	onSelectClick?: (e: React.MouseEvent) => void
}) {
	const hasVariants = product.variants && product.variants.length > 0
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		hasVariants ? product.variants![0]!.id : null
	)

	const unit = product.unit ?? "piece"
	const display =
		hasVariants && selectedVariantId
			? (() => {
					const v = product.variants!.find(x => x.id === selectedVariantId)
					return v
						? { price: v.price, quantity: v.quantity, lowStockThreshold: v.lowStockThreshold }
						: {
								price: product.price,
								quantity: product.quantity,
								lowStockThreshold: product.lowStockThreshold,
							}
				})()
			: {
					price: product.price,
					quantity: product.quantity,
					lowStockThreshold: product.lowStockThreshold,
				}

	const isLow = display.quantity <= display.lowStockThreshold
	const stockLabel = display.quantity === 0 ? "Out of stock" : isLow ? "Low stock" : "In stock"

	return (
		<Card className="hover:border-primary/20 flex min-h-0 min-w-0 flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
			<CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h3 className="text-foreground text-base leading-tight font-semibold">
							{product.name}
						</h3>
						<p className="text-muted-foreground mt-0.5 text-sm">{product.brand}</p>
					</div>
					<span
						className={cn(
							"shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
							display.quantity === 0 && "bg-destructive/10 text-destructive",
							isLow && display.quantity > 0 && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
							!isLow && "bg-primary/10 text-primary"
						)}
					>
						{stockLabel}
					</span>
				</div>
				{product.dosage && (
					<p className="text-muted-foreground mt-2 text-sm">Dosage: {product.dosage}</p>
				)}
				{product.description && (
					<p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">{product.description}</p>
				)}
				{hasVariants && (
					<div className="mt-3" onClick={onSelectClick}>
						<label htmlFor={`variant-${product.id}`} className="sr-only">
							Select size / variant
						</label>
						<select
							id={`variant-${product.id}`}
							value={selectedVariantId ?? ""}
							onChange={e => setSelectedVariantId(e.target.value || null)}
							onClick={e => e.stopPropagation()}
							className="border-input text-foreground focus:ring-ring w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none"
						>
							{product.variants!.map(v => (
								<option key={v.id} value={v.id}>
									{v.label} — ₱{v.price.toFixed(2)} ({v.quantity} left)
								</option>
							))}
						</select>
					</div>
				)}
				<p className="text-muted-foreground mt-1.5 text-sm">
					{display.quantity} {unit}
					{display.quantity !== 1 ? "s" : ""} left
				</p>
				<div className="border-border mt-4 flex items-center justify-between gap-2 border-t pt-3">
					<span className="text-foreground text-lg font-semibold">₱{display.price.toFixed(2)}</span>
					<span className="text-muted-foreground truncate text-sm">{storeName}</span>
				</div>
			</CardContent>
		</Card>
	)
}

export function LandingProductSection({ isCustomer = false }: { isCustomer?: boolean }) {
	const router = useRouter()
	const [query, setQuery] = useState("")
	const [category, setCategory] = useState("")
	const [city, setCity] = useState("")
	const [storeId, setStoreId] = useState("")
	const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("name-asc")
	const [registerModalOpen, setRegisterModalOpen] = useState(false)

	const { ref: headingRef, isInView: headingInView } = useInView<HTMLDivElement>()
	const { ref: gridRef, isInView: gridInView } = useInView<HTMLDivElement>({ threshold: 0.05 })

	const { data: catalog, isLoading, isError } = useLandingCatalog()
	const products = catalog?.products ?? []
	const pharmacies: LandingPharmacy[] = catalog?.pharmacies ?? []
	const catalogCategories = catalog?.categories ?? []

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
	const cities = useMemo(
		() =>
			Array.from(new Set(pharmacies.flatMap(s => [s.city, s.municipality].filter(Boolean)))).sort(),
		[pharmacies]
	)

	const filtered = useMemo(
		() => sortProducts(filterProducts(products, pharmacies, query, category, city, storeId), sort),
		[products, pharmacies, query, category, city, storeId, sort]
	)

	const hasFilters = category || city || storeId

	return (
		<div className="w-full space-y-6">
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
				<Input
					type="search"
					placeholder="Search by name, brand, category..."
					value={query}
					onChange={e => setQuery(e.target.value)}
					className="w-full sm:max-w-md"
					aria-label="Search products"
				/>
				<select
					value={sort}
					onChange={e => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
					className="border-input text-foreground focus:ring-ring h-8 rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
				>
					{SORT_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			<div className="flex flex-wrap items-center gap-3 sm:gap-4">
				<span className="text-muted-foreground w-full text-sm sm:w-auto">Filters:</span>
				<select
					value={category}
					onChange={e => setCategory(e.target.value)}
					className="border-input text-foreground focus:ring-ring h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:outline-none sm:min-w-[140px] sm:flex-none md:min-w-[160px]"
				>
					<option value="">All categories</option>
					{categories.map(c => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
				<select
					value={city}
					onChange={e => setCity(e.target.value)}
					className="border-input text-foreground focus:ring-ring h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:outline-none sm:min-w-[160px] sm:flex-none md:min-w-[180px]"
				>
					<option value="">All locations</option>
					{cities.map(c => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
				<select
					value={storeId}
					onChange={e => setStoreId(e.target.value)}
					className="border-input text-foreground focus:ring-ring h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:outline-none sm:min-w-[180px] sm:flex-none md:min-w-[200px]"
				>
					<option value="">All stores</option>
					{pharmacies.map(pharmacy => (
						<option key={pharmacy.id} value={pharmacy.id}>
							{pharmacy.name}
						</option>
					))}
				</select>
				{hasFilters && (
					<button
						type="button"
						onClick={() => {
							setCategory("")
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
				{isLoading
					? "Loading real-time availability..."
					: `${filtered.length}${isError ? " (API error)" : ""} result${filtered.length !== 1 ? "s" : ""}`}
			</p>

			{filtered.length === 0 ? (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<p className="text-foreground mb-1 font-medium">No products found</p>
					<p className="text-muted-foreground mb-4 text-sm">
						Try adjusting your search or filters to see more results.
					</p>
					<button
						type="button"
						onClick={() => setQuery("")}
						className="text-primary text-sm font-medium hover:underline"
					>
						Clear search
					</button>
				</div>
			) : (
				<div
					ref={gridRef}
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					{filtered.map((product, i) => (
						<div
							key={product.id}
							role="button"
							tabIndex={0}
							className={`focus-visible:ring-ring cursor-pointer rounded-xl transition-all duration-500 outline-none focus-visible:ring-2 ${
								gridInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-100"
							}`}
							style={{ transitionDelay: gridInView ? `${Math.min(i, 7) * 80}ms` : "0ms" }}
							onClick={() => {
								if (isCustomer) {
									router.push(`/product/${product.id}` as Route)
								} else {
									setRegisterModalOpen(true)
								}
							}}
							onKeyDown={e => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									if (isCustomer) {
										router.push(`/product/${product.id}` as Route)
									} else {
										setRegisterModalOpen(true)
									}
								}
							}}
						>
							<ProductCard
								product={product}
								storeName={pharmacyById.get(product.storeId)?.name ?? "Unknown"}
								onSelectClick={e => e.stopPropagation()}
							/>
						</div>
					))}
				</div>
			)}
			<LandingRegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />
		</div>
	)
}
