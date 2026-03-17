"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { DataTable } from "@/core/components/data-table/data-table"
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
}

export function ProductsTable({ onEdit, onDelete }: ProductsTableProps) {
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: categories } = useProductCategoriesQuery()
	const productsQuery = useProductsQuery()

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
				header: "Name",
				cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
			},
			{
				accessorKey: "pharmacyName",
				header: "Pharmacy",
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.pharmacyName ?? "—"}</span>,
			},
			{
				id: "brandGeneric",
				header: "Brand / Generic",
				cell: ({ row }) => row.original.brandName || row.original.genericName || "—",
			},
			{
				accessorKey: "categoryName",
				header: "Category",
			},
			{
				accessorKey: "unit",
				header: "Unit",
			},
			{
				id: "variants",
				header: "Variants",
				cell: ({ row }) => {
					const count = row.original.variantsCount ?? 0
					return <span className="text-muted-foreground text-sm">{count > 0 ? `${count} variant${count !== 1 ? "s" : ""}` : "—"}</span>
				},
			},
			{
				accessorKey: "strength",
				header: "Strength",
				cell: ({ row }) => row.original.strength || "—",
			},
			{
				accessorKey: "supplier",
				header: "Supplier",
				cell: ({ row }) => row.original.supplier || "—",
			},
			{
				id: "rx",
				header: "Rx",
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
									{onEdit ? (
										<DropdownMenuItem onClick={() => onEdit(product)}>
											<Pencil className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
									) : null}
									{onDelete ? (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive">
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
		[onEdit, onDelete]
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

