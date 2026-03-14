"use client"

import { useMemo, useState } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { cn } from "@/core/lib/utils"
import type { LandingProduct } from "@/features/landing/data/types"

const SORT_OPTIONS = [
	{ value: "name-asc", label: "Name A–Z" },
	{ value: "name-desc", label: "Name Z–A" },
	{ value: "price-asc", label: "Price low–high" },
	{ value: "price-desc", label: "Price high–low" },
] as const

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

function filterProducts(products: LandingProduct[], query: string, category: string) {
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
	if (category) {
		result = result.filter(p => p.category === category)
	}
	return result
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
						? {
								price: v.price ?? 0,
								quantity: v.quantity ?? 0,
								lowStockThreshold: v.lowStockThreshold ?? 0,
							}
						: {
								price: product.price ?? 0,
								quantity: product.quantity ?? 0,
								lowStockThreshold: product.lowStockThreshold ?? 0,
							}
				})()
			: {
					price: product.price ?? 0,
					quantity: product.quantity ?? 0,
					lowStockThreshold: product.lowStockThreshold ?? 0,
				}

	const isLow = display.quantity <= display.lowStockThreshold
	const stockLabel = display.quantity === 0 ? "Out of stock" : isLow ? "Low stock" : "In stock"

	return (
		<Card className="flex min-h-0 min-w-0 flex-col overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
			<CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h3 className="text-foreground text-lg leading-tight font-bold tracking-tight">
							{product.name}
						</h3>
						<p className="text-muted-foreground mt-1 text-sm">{product.brand}</p>
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
					<p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
						{product.description}
					</p>
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
					<span className="text-foreground text-lg font-semibold">
						₱{(display.price ?? 0).toFixed(2)}
					</span>
					<span className="text-muted-foreground truncate text-sm">{storeName}</span>
				</div>
			</CardContent>
		</Card>
	)
}

export function PharmacyProductsClient({
	products,
	pharmacyName,
}: {
	products: LandingProduct[]
	pharmacyName: string
}) {
	const router = useRouter()
	const [query, setQuery] = useState("")
	const [category, setCategory] = useState("")
	const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("name-asc")

	const categories = useMemo(
		() => Array.from(new Set(products.map(p => p.category))).sort(),
		[products]
	)

	const filtered = useMemo(
		() => sortProducts(filterProducts(products, query, category), sort),
		[products, query, category, sort]
	)

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<Input
					type="search"
					placeholder="Search by name, brand, category..."
					value={query}
					onChange={e => setQuery(e.target.value)}
					className="w-full sm:max-w-md"
					aria-label="Search products in this pharmacy"
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
				<span className="text-muted-foreground w-full text-sm sm:w-auto">Filter by:</span>
				<select
					value={category}
					onChange={e => setCategory(e.target.value)}
					className="border-input text-foreground focus:ring-ring h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:outline-none sm:min-w-[160px] sm:flex-none md:min-w-[180px]"
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
						}}
						className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
					>
						Clear filters
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filtered.map((product, i) => (
						<div
							key={product.id}
							role="button"
							tabIndex={0}
							className="animate-in fade-in slide-in-from-bottom-4 focus-visible:ring-ring cursor-pointer rounded-xl outline-none focus-visible:ring-2"
							style={{ animationDelay: `${Math.min(i * 50, 500)}ms`, animationFillMode: "both" }}
							onClick={() => {
								router.push(`/product/${product.id}` as Route)
							}}
							onKeyDown={e => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									router.push(`/product/${product.id}` as Route)
								}
							}}
						>
							<ProductCard
								product={product}
								storeName={pharmacyName}
								onSelectClick={e => e.stopPropagation()}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

