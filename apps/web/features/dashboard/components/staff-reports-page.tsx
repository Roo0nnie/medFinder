"use client"

import { useDeferredValue, useState } from "react"
import { AlertTriangle, Building2, Package2, Search, ShieldAlert, Warehouse } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { cn } from "@/core/lib/utils"
import { useOwnerAuditEventsQuery } from "@/features/dashboard/api/analytics.hooks"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import {
	useInventoryListQuery,
	useProductCategoriesQuery,
	useProductsQuery,
	type PharmacyInventoryItem,
} from "@/features/products/api/products.hooks"
import { getStockStatus, type StockStatusKind } from "@/features/products/lib/stock-status"

import { TopProductsChart } from "./DashboardCharts"
import { StatCard } from "./StatCard"

type StockFilterValue = "all" | StockStatusKind

type StaffReportRow = PharmacyInventoryItem & {
	productName: string
	categoryId: string | null
	categoryName: string
	pharmacyName: string
	lowStockThreshold: number
	stockKind: StockStatusKind
	stockLabel: string
}

const CHART_LIMIT = 8
const ACTIVITY_RESOURCE_TYPES = new Set([
	"MedicalProduct",
	"MedicalProductVariant",
	"PharmacyInventory",
	"ProductCategory",
	"Pharmacy",
])

function stockBadgeClass(kind: StockStatusKind) {
	return cn(
		"border-0",
		kind === "not_for_sale" && "bg-muted text-muted-foreground",
		kind === "out_of_stock" && "bg-destructive/15 text-destructive",
		kind === "low_stock" &&
			"bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
		kind === "in_stock" &&
			"bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
	)
}

function statusPriority(kind: StockStatusKind) {
	if (kind === "out_of_stock") return 0
	if (kind === "low_stock") return 1
	if (kind === "not_for_sale") return 2
	return 3
}

function roleBadgeClass(role: string | null | undefined) {
	if (role === "owner") {
		return "bg-violet-500/15 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300"
	}
	if (role === "admin") {
		return "bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-300"
	}
	if (role === "customer") {
		return "bg-amber-500/15 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
	}
	return "bg-sky-500/15 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300"
}

function formatCurrency(value: string | null | undefined) {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return "-"
	return `$${parsed.toFixed(2)}`
}

function formatActivityTime(value: string) {
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return "-"
	return parsed.toLocaleString()
}

function formatAuditDetails(details: string, productNameById: Map<string, { name: string }>) {
	if (!details) return details

	return details.replace(
		/\b(productId|product)\s*[:=]\s*([^\s,]+)/g,
		(fullMatch, _key: string, rawId: string) => {
			const id = String(rawId ?? "").trim()
			const product = id ? productNameById.get(id) : undefined
			if (!product?.name) return fullMatch
			return product.name
		}
	)
}

function LoadingSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
				{Array.from({ length: 5 }).map((_, index) => (
					<div
						key={index}
						className="bg-muted/40 border-border h-28 animate-pulse rounded-xl border"
					/>
				))}
			</div>
			<div className="grid gap-6 xl:grid-cols-2">
				<div className="bg-muted/40 border-border h-[320px] animate-pulse rounded-xl border" />
				<div className="bg-muted/40 border-border h-[320px] animate-pulse rounded-xl border" />
			</div>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
				<div className="bg-muted/40 border-border h-[420px] animate-pulse rounded-xl border" />
				<div className="bg-muted/40 border-border h-[420px] animate-pulse rounded-xl border" />
			</div>
		</div>
	)
}

export function StaffReportsPageContent() {
	const [pharmacyFilter, setPharmacyFilter] = useState("all")
	const [categoryFilter, setCategoryFilter] = useState("all")
	const [stockFilter, setStockFilter] = useState<StockFilterValue>("all")
	const [searchInput, setSearchInput] = useState("")

	const deferredSearch = useDeferredValue(searchInput.trim().toLowerCase())

	const inventoryQuery = useInventoryListQuery()
	const productsQuery = useProductsQuery()
	const pharmaciesQuery = useMyPharmaciesQuery()
	const categoriesQuery = useProductCategoriesQuery()
	const auditQuery = useOwnerAuditEventsQuery(60)

	const mainError =
		inventoryQuery.error || productsQuery.error || pharmaciesQuery.error || categoriesQuery.error
	const isMainLoading =
		inventoryQuery.isLoading ||
		productsQuery.isLoading ||
		pharmaciesQuery.isLoading ||
		categoriesQuery.isLoading

	const products = productsQuery.data ?? []
	const pharmacies = pharmaciesQuery.data ?? []
	const categories = categoriesQuery.data ?? []
	const inventory = inventoryQuery.data ?? []

	const productMap = new Map(
		products.map(product => [
			product.id,
			{
				name: product.name,
				categoryId: product.categoryId ?? null,
				lowStockThreshold: product.lowStockThreshold ?? 5,
			},
		])
	)
	const pharmacyMap = new Map(pharmacies.map(pharmacy => [pharmacy.id, pharmacy.name]))
	const categoryMap = new Map(categories.map(category => [category.id, category.name]))

	const rows: StaffReportRow[] = inventory.map((item: PharmacyInventoryItem) => {
		const product = productMap.get(item.productId)
		const lowStockThreshold = product?.lowStockThreshold ?? 5
		const stock = getStockStatus({
			quantity: item.quantity,
			isAvailable: item.isAvailable,
			lowStockThreshold,
		})

		return {
			...item,
			productName: product?.name ?? item.productId,
			categoryId: product?.categoryId ?? null,
			categoryName: product?.categoryId
				? (categoryMap.get(product.categoryId) ?? "Uncategorized")
				: "Uncategorized",
			pharmacyName: pharmacyMap.get(item.pharmacyId) ?? item.pharmacyId,
			lowStockThreshold,
			stockKind: stock.kind,
			stockLabel: stock.label,
		}
	})

	const filteredRows = rows.filter(row => {
		if (pharmacyFilter !== "all" && row.pharmacyId !== pharmacyFilter) return false
		if (categoryFilter !== "all" && row.categoryId !== categoryFilter) return false
		if (stockFilter !== "all" && row.stockKind !== stockFilter) return false
		if (!deferredSearch) return true

		const haystack = [row.productName, row.pharmacyName, row.categoryName, row.variantLabel ?? ""]
			.join(" ")
			.toLowerCase()

		return haystack.includes(deferredSearch)
	})

	const lowStockCount = filteredRows.filter(row => row.stockKind === "low_stock").length
	const outOfStockCount = filteredRows.filter(row => row.stockKind === "out_of_stock").length
	const unavailableCount = filteredRows.filter(row => row.stockKind === "not_for_sale").length
	const pharmaciesCoveredCount = new Set(filteredRows.map(row => row.pharmacyId)).size

	const inventoryByPharmacyMap = new Map<string, number>()
	for (const row of filteredRows) {
		inventoryByPharmacyMap.set(
			row.pharmacyName,
			(inventoryByPharmacyMap.get(row.pharmacyName) ?? 0) + 1
		)
	}
	const inventoryByPharmacyData = Array.from(inventoryByPharmacyMap.entries())
		.map(([name, value]) => ({ name, value }))
		.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
		.slice(0, CHART_LIMIT)

	const productsByCategoryMap = new Map<string, Set<string>>()
	for (const row of filteredRows) {
		const bucket = productsByCategoryMap.get(row.categoryName) ?? new Set<string>()
		bucket.add(row.productId)
		productsByCategoryMap.set(row.categoryName, bucket)
	}
	const productsByCategoryData = Array.from(productsByCategoryMap.entries())
		.map(([name, productIds]) => ({ name, value: productIds.size }))
		.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
		.slice(0, CHART_LIMIT)

	const priorityRows = filteredRows
		.filter(row => row.stockKind === "low_stock" || row.stockKind === "out_of_stock")
		.sort((left, right) => {
			const priorityDelta = statusPriority(left.stockKind) - statusPriority(right.stockKind)
			if (priorityDelta !== 0) return priorityDelta
			if (left.quantity !== right.quantity) return left.quantity - right.quantity
			return left.productName.localeCompare(right.productName)
		})

	const recentActivity = (auditQuery.data?.items ?? [])
		.filter(item => {
			const [resourceType] = item.resource.split(":")
			return resourceType ? ACTIVITY_RESOURCE_TYPES.has(resourceType) : false
		})
		.slice(0, 8)

	const selectedPharmacyLabel =
		pharmacyFilter === "all" ? "All pharmacies" : (pharmacyMap.get(pharmacyFilter) ?? "Pharmacy")
	const selectedCategoryLabel =
		categoryFilter === "all" ? "All categories" : (categoryMap.get(categoryFilter) ?? "Category")
	const selectedStockLabel =
		stockFilter === "all"
			? "All stock"
			: stockFilter === "low_stock"
				? "Low stock"
				: stockFilter === "out_of_stock"
					? "Out of stock"
					: stockFilter === "not_for_sale"
						? "Not available"
						: "In stock"

	const hasActiveFilters =
		pharmacyFilter !== "all" ||
		categoryFilter !== "all" ||
		stockFilter !== "all" ||
		searchInput.trim().length > 0

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-foreground text-3xl font-bold tracking-tight">Reports</h1>
				<p className="text-muted-foreground mt-2 max-w-3xl text-sm">
					Read-only operational reporting for the same owner-wide inventory scope used by staff
					products and stock alerts.
				</p>
			</div>

			<Card>
				<CardHeader className="gap-3">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<CardTitle>Operational filters</CardTitle>
							<CardDescription>
								Cards, charts, and the priority table update from this shared filter set.
							</CardDescription>
						</div>
						<div className="text-muted-foreground text-xs">
							{isMainLoading
								? "Loading current snapshot..."
								: `Showing ${filteredRows.length} inventory rows`}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-col gap-3 xl:flex-row xl:items-center">
						<div className="flex flex-wrap items-center gap-2 xl:shrink-0">
							<Select
								value={pharmacyFilter}
								onValueChange={value => setPharmacyFilter(value ?? "all")}
							>
								<SelectTrigger className="w-[150px]">
									<span className="truncate">{selectedPharmacyLabel}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All pharmacies</SelectItem>
									{pharmacies.map(pharmacy => (
										<SelectItem key={pharmacy.id} value={pharmacy.id}>
											{pharmacy.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={categoryFilter}
								onValueChange={value => setCategoryFilter(value ?? "all")}
							>
								<SelectTrigger className="w-[150px]">
									<span className="truncate">{selectedCategoryLabel}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All categories</SelectItem>
									{categories.map(category => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={stockFilter}
								onValueChange={value => setStockFilter((value ?? "all") as StockFilterValue)}
							>
								<SelectTrigger className="w-[140px]">
									<span className="truncate">{selectedStockLabel}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All stock</SelectItem>
									<SelectItem value="low_stock">Low stock</SelectItem>
									<SelectItem value="out_of_stock">Out of stock</SelectItem>
									<SelectItem value="not_for_sale">Not available</SelectItem>
									<SelectItem value="in_stock">In stock</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex w-full gap-2 xl:ml-4 xl:max-w-[460px]">
							<div className="relative min-w-0 flex-1">
								<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input
									value={searchInput}
									onChange={event => setSearchInput(event.target.value)}
									placeholder="Search product, pharmacy, category, or variant..."
									className="pl-9"
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setPharmacyFilter("all")
									setCategoryFilter("all")
									setStockFilter("all")
									setSearchInput("")
								}}
								disabled={!hasActiveFilters}
							>
								Reset
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{mainError && !isMainLoading ? (
				<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
					{mainError.message}
				</div>
			) : null}

			{isMainLoading ? (
				<LoadingSkeleton />
			) : !mainError ? (
				<>
					<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
						<StatCard
							title="Inventory Rows"
							value={filteredRows.length}
							icon={<Package2 className="h-4 w-4" />}
						/>
						<StatCard
							title="Low Stock"
							value={lowStockCount}
							icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
							className="border-amber-500/20 bg-amber-500/10"
						/>
						<StatCard
							title="Out Of Stock"
							value={outOfStockCount}
							icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
							className="border-destructive/20 bg-destructive/10"
						/>
						<StatCard
							title="Not Available"
							value={unavailableCount}
							icon={<Warehouse className="h-4 w-4" />}
						/>
						<StatCard
							title="Pharmacies Covered"
							value={pharmaciesCoveredCount}
							icon={<Building2 className="h-4 w-4" />}
						/>
					</div>

					<div className="grid gap-6 xl:grid-cols-2">
						<TopProductsChart
							data={inventoryByPharmacyData}
							title="Inventory By Pharmacy"
							subtitle="Tracked inventory rows inside the current filter set."
						/>
						<TopProductsChart
							data={productsByCategoryData}
							title="Products By Category"
							subtitle="Unique products represented by the current filter set."
						/>
					</div>

					<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
						<Card>
							<CardHeader>
								<CardTitle>Priority stock report</CardTitle>
								<CardDescription>
									Low-stock and out-of-stock rows sorted by urgency and current quantity.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Variant</TableHead>
											<TableHead className="text-right">Quantity</TableHead>
											<TableHead className="text-right">Threshold</TableHead>
											<TableHead className="text-right">Price</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{priorityRows.length > 0 ? (
											priorityRows.map(row => (
												<TableRow key={row.id}>
													<TableCell className="text-foreground font-medium">
														{row.productName}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{row.categoryName}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{row.variantLabel ?? "-"}
													</TableCell>
													<TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
													<TableCell className="text-right tabular-nums">
														{row.lowStockThreshold}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{formatCurrency(row.price)}
													</TableCell>
													<TableCell>
														<Badge variant="outline" className={stockBadgeClass(row.stockKind)}>
															{row.stockLabel}
														</Badge>
													</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
													No low-stock or out-of-stock rows match the current filters.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Recent tenant activity</CardTitle>
								<CardDescription>
									Recent owner-wide operational activity across your owner&apos;s pharmacies. This
									is not limited to your own actions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{auditQuery.isLoading ? (
									<p className="text-muted-foreground text-sm">Loading recent activity...</p>
								) : auditQuery.error ? (
									<p className="text-destructive text-sm">{auditQuery.error.message}</p>
								) : recentActivity.length > 0 ? (
									recentActivity.map(item => {
										const [resourceType] = item.resource.split(":")
										const formattedDetails = formatAuditDetails(item.details, productMap)
										return (
											<div
												key={item.id}
												className="border-border flex flex-col gap-2 rounded-lg border p-3"
											>
												<div className="flex flex-wrap items-center gap-2">
													<Badge
														variant="outline"
														className={cn("border-0", roleBadgeClass(item.actorRole))}
													>
														{item.actorRole ?? "unknown"}
													</Badge>
													<span className="text-foreground text-sm font-medium">{item.action}</span>
												</div>
												{formattedDetails ? (
													<p className="text-foreground text-sm">{formattedDetails}</p>
												) : null}
												<div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
													<span className="truncate">{item.actor}</span>
													<span>{formatActivityTime(item.createdAt)}</span>
												</div>
											</div>
										)
									})
								) : (
									<p className="text-muted-foreground text-sm">
										No recent operational activity is available yet.
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</>
			) : null}
		</div>
	)
}
