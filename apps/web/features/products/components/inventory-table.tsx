"use client"

import { useMemo, useState } from "react"
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
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useToast } from "@/core/components/ui/use-toast"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import {
	useInventoryDeleteMutation,
	useInventoryListQuery,
	useInventoryUpdateMutation,
	useProductsQuery,
	type PharmacyInventoryItem,
} from "@/features/products/api/products.hooks"

type InventoryRow = PharmacyInventoryItem & {
	productName?: string
	pharmacyName?: string
	variantLabelDisplay?: string
	priceDisplay?: string
	discountDisplay?: string
}

export type InventoryTableProps = {
	onEditRow?: (row: PharmacyInventoryItem) => void
	onDeleteRow?: (row: PharmacyInventoryItem) => void
}

export function InventoryTable({ onEditRow, onDeleteRow }: InventoryTableProps) {
	const { toast } = useToast()
	const { data: products = [] } = useProductsQuery()
	const { data: pharmacies = [] } = useMyPharmaciesQuery()
	const inventoryQuery = useInventoryListQuery()

	const updateMutation = useInventoryUpdateMutation()
	const deleteMutation = useInventoryDeleteMutation()

	const [editing, setEditing] = useState<InventoryRow | null>(null)
	const [editQuantity, setEditQuantity] = useState<string>("")
	const [editPrice, setEditPrice] = useState<string>("")
	const [editDiscountPrice, setEditDiscountPrice] = useState<string>("")

	const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products])
	const pharmacyMap = useMemo(() => new Map(pharmacies.map(p => [p.id, p.name])), [pharmacies])

	const rows: InventoryRow[] = useMemo(() => {
		const list = inventoryQuery.data ?? []
		return list.map(r => ({
			...r,
			productName: productMap.get(r.productId) ?? r.productId,
			pharmacyName: pharmacyMap.get(r.pharmacyId) ?? r.pharmacyId,
			variantLabelDisplay: r.variantLabel ?? (r.variantId ? r.variantId : "—"),
			priceDisplay: r.price ? String(r.price) : "—",
			discountDisplay: r.discountPrice ? String(r.discountPrice) : "—",
		}))
	}, [inventoryQuery.data, productMap, pharmacyMap])

	const columns = useMemo<ColumnDef<InventoryRow>[]>(
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
				accessorKey: "productName",
				header: "Product",
				cell: ({ row }) => <span className="font-medium">{row.original.productName}</span>,
			},
			{
				accessorKey: "variantLabelDisplay",
				header: "Variant",
				cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.variantLabelDisplay}</span>,
			},
			{
				accessorKey: "pharmacyName",
				header: "Pharmacy",
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.pharmacyName}</span>,
			},
			{
				accessorKey: "quantity",
				header: "Qty",
				cell: ({ row }) => <span className="font-semibold">{row.original.quantity}</span>,
			},
			{
				accessorKey: "priceDisplay",
				header: "Price",
			},
			{
				accessorKey: "discountDisplay",
				header: "Discount",
			},
			{
				id: "available",
				header: "Available",
				cell: ({ row }) => (row.original.isAvailable ? "Yes" : "No"),
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const item = row.original
					const canDelegateEdit = typeof onEditRow === "function"
					const canDelegateDelete = typeof onDeleteRow === "function"
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
									<DropdownMenuItem
										onClick={() => {
											if (canDelegateEdit) {
												onEditRow(item)
												return
											}
											setEditing(item)
											setEditQuantity(String(item.quantity ?? 0))
											setEditPrice(String(item.price ?? ""))
											setEditDiscountPrice(item.discountPrice ? String(item.discountPrice) : "")
										}}
									>
										<Pencil className="mr-2 h-4 w-4" />
										{canDelegateEdit ? "Edit" : "Quick edit"}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={async () => {
											if (canDelegateDelete) {
												onDeleteRow(item)
												return
											}
											try {
												await deleteMutation.mutateAsync(item.id)
												toast({ title: "Inventory row deleted" })
											} catch (e) {
												toast({
													title: "Delete failed",
													description: e instanceof Error ? e.message : "Unknown error",
													variant: "destructive",
												})
											}
										}}
										className="text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[deleteMutation, toast, onEditRow, onDeleteRow]
	)

	const toolbarLeft = editing && !onEditRow ? (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
			<div className="space-y-1">
				<Label className="text-muted-foreground text-xs">Editing</Label>
				<div className="text-sm font-medium">
					{editing.productName} · {editing.variantLabelDisplay} · {editing.pharmacyName}
				</div>
			</div>
			<div className="flex flex-wrap items-end gap-2">
				<div className="space-y-1">
					<Label htmlFor="inv-qty" className="text-muted-foreground text-xs">
						Qty
					</Label>
					<Input
						id="inv-qty"
						className="h-8 w-24"
						type="number"
						min={0}
						value={editQuantity}
						onChange={e => setEditQuantity(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="inv-price" className="text-muted-foreground text-xs">
						Price
					</Label>
					<Input
						id="inv-price"
						className="h-8 w-28"
						type="number"
						min={0}
						step="0.01"
						value={editPrice}
						onChange={e => setEditPrice(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="inv-discount" className="text-muted-foreground text-xs">
						Discount
					</Label>
					<Input
						id="inv-discount"
						className="h-8 w-28"
						type="number"
						min={0}
						step="0.01"
						value={editDiscountPrice}
						onChange={e => setEditDiscountPrice(e.target.value)}
					/>
				</div>
				<Button
					size="sm"
					className="h-8"
					disabled={updateMutation.isPending}
					onClick={async () => {
						if (!editing) return
						const qty = Number(editQuantity)
						const price = String(Number(editPrice))
						if (Number.isNaN(qty) || qty < 0) {
							toast({ title: "Validation", description: "Qty must be a non-negative number.", variant: "destructive" })
							return
						}
						if (editPrice.trim() === "" || Number.isNaN(Number(editPrice)) || Number(editPrice) < 0) {
							toast({ title: "Validation", description: "Price must be a non-negative number.", variant: "destructive" })
							return
						}
						const discount =
							editDiscountPrice.trim() === ""
								? null
								: Number.isNaN(Number(editDiscountPrice)) || Number(editDiscountPrice) < 0
									? undefined
									: String(Number(editDiscountPrice))
						if (discount === undefined) {
							toast({ title: "Validation", description: "Discount must be empty or a non-negative number.", variant: "destructive" })
							return
						}
						try {
							await updateMutation.mutateAsync({
								id: editing.id,
								quantity: qty,
								price,
								discountPrice: discount,
							})
							toast({ title: "Inventory updated" })
							setEditing(null)
						} catch (e) {
							toast({
								title: "Update failed",
								description: e instanceof Error ? e.message : "Unknown error",
								variant: "destructive",
							})
						}
					}}
				>
					Save
				</Button>
				<Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(null)}>
					Cancel
				</Button>
			</div>
		</div>
	) : null

	return (
		<DataTable
			data={rows}
			columns={columns}
			toolbarLeft={toolbarLeft}
			isLoading={inventoryQuery.isLoading}
			errorText={inventoryQuery.isError ? "Failed to load inventory." : null}
			searchPlaceholder="Search inventory..."
		/>
	)
}

