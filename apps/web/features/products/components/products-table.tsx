"use client"

import { useEffect, useMemo, useRef } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react"

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
}

export function ProductsTable({ onEdit, onDelete, onAddBrand }: ProductsTableProps) {
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: categories } = useProductCategoriesQuery()
	const productsQuery = useProductsQuery()
	const onEditRef = useRef(onEdit)
	const onDeleteRef = useRef(onDelete)
	const onAddBrandRef = useRef(onAddBrand)

	useEffect(() => {
		onEditRef.current = onEdit
	}, [onEdit])

	useEffect(() => {
		onDeleteRef.current = onDelete
	}, [onDelete])

	useEffect(() => {
		onAddBrandRef.current = onAddBrand
	}, [onAddBrand])

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
				cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
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
											<DropdownMenuItem onClick={() => onDeleteRef.current?.(product)} className="text-destructive">
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

	return (
		<DataTable
			data={rows}
			columns={columns}
			isLoading={productsQuery.isLoading}
			errorText={productsQuery.isError ? "Failed to load products from the API." : null}
			searchPlaceholder="Search products..."
		/>
	)
}

