"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { FolderTree, MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react"

import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { useToast } from "@/core/components/ui/use-toast"
import { useMyBrandsQuery } from "@/features/brands/api/brands.hooks"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { useProductCategoriesQuery, useProductsQuery, type Product } from "@/features/products/api/products.hooks"

type ProductRow = Product & {
	pharmacyName?: string | null
	categoryName?: string | null
	variantsCount?: number
}

export type ProductsTableProps = {
	onEdit?: (product: Product) => void
	onDelete?: (product: Product) => void
	onAddBrand?: (product: Product) => void
	/** Notifies parent when row selection changes (for header bulk actions). */
	onSelectionChange?: (rows: Product[]) => void
	selectionClearKey?: number | string
}

export function ProductsTable({
	onEdit,
	onDelete,
	onAddBrand,
	onSelectionChange,
	selectionClearKey,
}: ProductsTableProps) {
	const { toast } = useToast()
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: categories } = useProductCategoriesQuery()
	const { data: myBrands } = useMyBrandsQuery()
	const productsQuery = useProductsQuery()
	const productsLoadErrorNotified = useRef(false)
	const onEditRef = useRef(onEdit)
	const onDeleteRef = useRef(onDelete)
	const onAddBrandRef = useRef(onAddBrand)
	const [filterBrandId, setFilterBrandId] = useState("")
	const [filterCategoryId, setFilterCategoryId] = useState("")

	useEffect(() => {
		onEditRef.current = onEdit
	}, [onEdit])

	useEffect(() => {
		onDeleteRef.current = onDelete
	}, [onDelete])

	useEffect(() => {
		onAddBrandRef.current = onAddBrand
	}, [onAddBrand])

	useEffect(() => {
		if (productsQuery.isError) {
			if (!productsLoadErrorNotified.current) {
				productsLoadErrorNotified.current = true
				toast({
					title: "Failed to load products",
					description: "Could not load products from the API.",
					variant: "destructive",
				})
			}
		} else {
			productsLoadErrorNotified.current = false
		}
	}, [productsQuery.isError, toast])

	const pharmacyMap = useMemo(() => new Map((pharmacies ?? []).map(p => [p.id, p.name])), [pharmacies])
	const categoryMap = useMemo(() => new Map((categories ?? []).map(c => [c.id, c.name])), [categories])

	const rows: ProductRow[] = useMemo(() => {
		const list = productsQuery.data ?? []
		return list.map(p => ({
			...p,
			pharmacyName: p.pharmacyId ? pharmacyMap.get(p.pharmacyId) ?? p.pharmacyId : "—",
			categoryName: categoryMap.get(p.categoryId) ?? p.categoryId,
			variantsCount: p.variants?.length ?? 0,
		}))
	}, [productsQuery.data, pharmacyMap, categoryMap])

	const filteredRows = useMemo(() => {
		return rows.filter(p => {
			if (filterBrandId && (p.brandId ?? "") !== filterBrandId) return false
			if (filterCategoryId && p.categoryId !== filterCategoryId) return false
			return true
		})
	}, [rows, filterBrandId, filterCategoryId])

	const columns = useMemo<ColumnDef<ProductRow>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={value => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Name" />,
				cell: ({ row }) => (
					<div className="flex min-w-0 items-center gap-2">
						<span className="min-w-0 truncate font-semibold">{row.original.name}</span>
						{row.getIsSelected() && onDeleteRef.current ? (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
								aria-label="Delete product"
								onClick={e => {
									e.stopPropagation()
									onDeleteRef.current?.(row.original)
								}}
							>
							</Button>
						) : null}
					</div>
				),
			},
			{
				id: "brandGeneric",
				accessorFn: row => (row.brandName || row.genericName || "").toLowerCase(),
				header: ({ column }) => <SortableHeader column={column} label="Brand / Generic" />,
				cell: ({ row }) => row.original.brandName || row.original.genericName || "—",
			},
			{
				accessorKey: "categoryName",
				header: ({ column }) => <SortableHeader column={column} label="Category" />,
			},

			{
				accessorKey: "variantsCount",
				header: ({ column }) => <SortableHeader column={column} label="Variants" />,
				cell: ({ row }) => {
					const count = row.original.variantsCount ?? 0
					return (
						<span className="text-muted-foreground text-sm">
							{count > 0 ? `${count} variant${count !== 1 ? "s" : ""}` : "—"}
						</span>
					)
				},
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
				cell: ({ row }) => (row.original.requiresPrescription ? "Yes" : "No"),
			},
			{
				id: "actions",
				header: () => (
					<div className="text-right">
						<span className="text-xs font-semibold">Action</span>
					</div>
				),
				enableSorting: false,
				cell: ({ row }) => {
					const product = row.original
					return (
						<div className="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onEditRef.current ? (
										<DropdownMenuItem onClick={() => onEditRef.current?.(product)}>
											<Pencil className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
									) : null}
									{onAddBrandRef.current ? (
										<DropdownMenuItem onClick={() => onAddBrandRef.current?.(product)}>
											<Tag className="mr-2 h-4 w-4" />
											Add new brand
										</DropdownMenuItem>
									) : null}
									{onDeleteRef.current ? (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => onDeleteRef.current?.(product)}
												className="text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</>
									) : null}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[]
	)

	const toolbarRight = (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
			<Select value={filterBrandId} onValueChange={v => setFilterBrandId(v ?? "")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-48">
					<div className="flex min-w-0 items-center gap-2">
						<Tag className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<SelectValue />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All brands</SelectItem>
					{(myBrands ?? []).map(b => (
						<SelectItem key={b.id} value={b.id}>
							{b.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={filterCategoryId} onValueChange={v => setFilterCategoryId(v ?? "")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-48">
					<div className="flex min-w-0 items-center gap-2">
						<FolderTree className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<SelectValue />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All categories</SelectItem>
					{(categories ?? []).map(c => (
						<SelectItem key={c.id} value={c.id}>
							{c.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DataTable
			data={filteredRows}
			columns={columns}
			toolbarRight={toolbarRight}
			isLoading={productsQuery.isLoading}
			errorText={productsQuery.isError ? "Failed to load products from the API." : null}
			searchPlaceholder="Search products..."
			getRowId={row => row.id}
			onSelectedRowsChange={onSelectionChange}
			selectionClearKey={selectionClearKey}
		/>
	)
}
