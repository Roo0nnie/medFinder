"use client"

import { useEffect, useMemo, useState } from "react"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"

import type { Product, ProductCategory } from "../api/products.hooks"

function isLowStock(product: Product): boolean {
	const threshold = product.lowStockThreshold ?? 5
	if (product.variants && product.variants.length > 0) {
		return product.variants.some(
			v => typeof (v as { quantity?: number }).quantity === "number" &&
				(v as { quantity?: number }).quantity! <=
					((v as { lowStockThreshold?: number }).lowStockThreshold ?? threshold)
		)
	}
	const q = product.quantity
	return typeof q === "number" && q <= threshold
}

export function StaffProductTable({
	products,
	categories,
	pharmacyMap,
	onView,
	isLoading,
	isError,
	errorMessage,
}: {
	products: Product[]
	categories: ProductCategory[] | undefined
	pharmacyMap: Map<string, string>
	onView: (product: Product) => void
	isLoading?: boolean
	isError?: boolean
	errorMessage?: string
}) {
	const [sorting, setSorting] = useState<SortingState>([])
	const [searchInput, setSearchInput] = useState("")
	const [globalFilter, setGlobalFilter] = useState("")
	const [pageSize, setPageSize] = useState(10)
	const [pageIndex, setPageIndex] = useState(0)
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [stockFilter, setStockFilter] = useState<"all" | "low" | "high">("all")

	const categoryMap = useMemo(() => new Map((categories ?? []).map(c => [c.id, c.name])), [categories])

	const filteredData = useMemo(() => {
		let list = products

		// Category filter
		if (categoryFilter !== "all") {
			list = list.filter(p => p.categoryId === categoryFilter)
		}

		// Stock filter
		if (stockFilter === "low") {
			list = list.filter(p => isLowStock(p))
		} else if (stockFilter === "high") {
			list = list.filter(p => !isLowStock(p))
		}

		// Search (global filter) - applied in table via globalFilterFn
		return list
	}, [products, categoryFilter, stockFilter])

	const columns = useMemo<ColumnDef<Product>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Name" />,
				cell: ({ row }) => (
					<span className="font-semibold">{row.original.name}</span>
				),
			},
			{
				id: "pharmacy",
				accessorFn: row => {
					const pid = row.pharmacyId
					return pid ? (pharmacyMap.get(pid) ?? pid) : ""
				},
				header: ({ column }) => <SortableHeader column={column} label="Pharmacy" />,
				cell: ({ row }) => {
					const pid = row.original.pharmacyId
					return (
						<span className="text-muted-foreground">
							{pid ? pharmacyMap.get(pid) ?? pid : "—"}
						</span>
					)
				},
			},
			{
				id: "brandGeneric",
				accessorFn: row => (row.brandName || row.genericName || "").toLowerCase(),
				header: ({ column }) => <SortableHeader column={column} label="Brand / Generic" />,
				cell: ({ row }) =>
					row.original.brandName || row.original.genericName || "—",
			},
			{
				id: "category",
				accessorFn: row => categoryMap.get(row.categoryId) ?? row.categoryId,
				header: ({ column }) => <SortableHeader column={column} label="Category" />,
				cell: ({ row }) => {
					const catId = row.original.categoryId
					return categoryMap.get(catId) ?? catId
				},
			},
			{
				id: "unit",
				header: ({ column }) => <SortableHeader column={column} label="Unit" />,
				accessorFn: row => row.variants?.[0]?.unit ?? "",
				cell: ({ row }) => row.original.variants?.[0]?.unit ?? "—",
			},
			{
				id: "variants",
				accessorFn: row => row.variants?.length ?? 0,
				header: ({ column }) => <SortableHeader column={column} label="Variants" />,
				cell: ({ row }) => {
					const v = row.original.variants
					if (!v || v.length === 0) return "—"
					return `${v.length} variant${v.length !== 1 ? "s" : ""}`
				},
			},
			{
				id: "strength",
				header: ({ column }) => <SortableHeader column={column} label="Strength" />,
				accessorFn: row => row.variants?.[0]?.strength ?? "",
				cell: ({ row }) => (row.original.variants?.[0]?.strength ?? "").trim() || "—",
			},
			{
				accessorKey: "supplier",
				header: ({ column }) => <SortableHeader column={column} label="Supplier" />,
				cell: ({ row }) => row.original.supplier || "—",
			},
			{
				id: "rx",
				accessorFn: row => (row.requiresPrescription ? 1 : 0),
				header: ({ column }) => <SortableHeader column={column} label="Rx" />,
				cell: ({ row }) =>
					row.original.requiresPrescription ? "Yes" : "No",
			},
			{
				id: "actions",
				header: () => (
					<div className="text-right">
						<span className="text-xs font-semibold">Action</span>
					</div>
				),
				enableSorting: false,
				cell: ({ row }) => (
					<div className="text-right">
						<Button
							variant="link"
							size="sm"
							className="h-auto p-0 text-primary"
							onClick={() => onView(row.original)}
						>
							View
						</Button>
					</div>
				),
			},
		],
		[categoryMap, pharmacyMap, onView]
	)

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: updater => {
			const next = updater({
				sorting,
				globalFilter,
				pagination: { pageIndex, pageSize },
			})
			if (next?.pagination) {
				setPageIndex(next.pagination.pageIndex)
				setPageSize(next.pagination.pageSize)
			}
		},
		globalFilterFn: (row, _columnId, filterValue) => {
			if (!filterValue || typeof filterValue !== "string") return true
			const v = filterValue.toLowerCase().trim()
			if (!v) return true
			const p = row.original
			const name = (p.name ?? "").toLowerCase()
			const brand = (p.brandName ?? "").toLowerCase()
			const generic = (p.genericName ?? "").toLowerCase()
			return name.includes(v) || brand.includes(v) || generic.includes(v)
		},
		state: {
			sorting,
			globalFilter,
			pagination: { pageIndex, pageSize },
		},
	})

	useEffect(() => {
		const t = setTimeout(() => setGlobalFilter(searchInput), 300)
		return () => clearTimeout(t)
	}, [searchInput])

	useEffect(() => {
		table.setPageIndex(0)
	}, [categoryFilter, stockFilter])

	const pageCount = table.getPageCount()
	const totalFiltered = filteredData.length

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Show</span>
					<Select
						value={String(pageSize)}
						onValueChange={value => {
							setPageSize(Number(value))
							setPageIndex(0)
						}}
					>
						<SelectTrigger className="h-8 w-16">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 20].map(size => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="text-muted-foreground text-sm">entries</span>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select
						value={categoryFilter}
						onValueChange={v => {
							setCategoryFilter(v)
							setPageIndex(0)
						}}
					>
						<SelectTrigger className="h-8 w-full min-w-32 sm:w-40">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All categories</SelectItem>
							{categories?.map(c => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={stockFilter}
						onValueChange={v => {
							setStockFilter(v as "all" | "low" | "high")
							setPageIndex(0)
						}}
					>
						<SelectTrigger className="h-8 w-full min-w-32 sm:w-40">
							<SelectValue placeholder="Stock" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All stock</SelectItem>
							<SelectItem value="low">Low stock</SelectItem>
							<SelectItem value="high">High stock</SelectItem>
						</SelectContent>
					</Select>
					<div className="relative w-full sm:w-64">
						<Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" />
						<Input
							placeholder="Search products..."
							value={searchInput}
							onChange={e => {
								setSearchInput(e.target.value)
								setPageIndex(0)
							}}
							className="h-8 w-full pl-8"
						/>
					</div>
				</div>
			</div>

			{isLoading && (
				<p className="text-muted-foreground text-xs">Loading products...</p>
			)}
			{isError && (
				<p className="text-destructive text-sm">
					{errorMessage ?? "Failed to load products."}
				</p>
			)}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{!isLoading && !isError ? (
							table.getRowModel().rows.length ? (
								table.getRowModel().rows.map(row => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map(cell => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="text-muted-foreground h-24 text-center"
									>
										No products found.
									</TableCell>
								</TableRow>
							)
						) : null}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-sm text-pretty">
					{totalFiltered > 0 ? (
						<>
							Showing {pageIndex * pageSize + 1} to{" "}
							{Math.min(
								(pageIndex + 1) * pageSize,
								totalFiltered
							)}{" "}
							of {totalFiltered} products
						</>
					) : (
						"No products to display"
					)}
				</p>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					{Array.from({ length: pageCount }, (_, i) => i + 1).map(
						page => (
							<Button
								key={page}
								variant={
									table.getState().pagination.pageIndex === page - 1
										? "default"
										: "outline"
								}
								size="icon"
								className="h-8 w-8"
								onClick={() => table.setPageIndex(page - 1)}
								aria-label={`Go to page ${page}`}
							>
								{page}
							</Button>
						)
					)}
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Next page"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
