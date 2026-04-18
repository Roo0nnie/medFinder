"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

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
	onSelectionChange?: (rows: PharmacyInventoryItem[]) => void
	selectionClearKey?: number | string
}

export function InventoryTable({
	onEditRow,
	onDeleteRow,
	onSelectionChange,
	selectionClearKey,
}: InventoryTableProps) {
	const { toast } = useToast()
	const { data: products = [], isError: productsQueryError } = useProductsQuery()
	const { data: pharmacies = [], isError: pharmaciesQueryError } = useMyPharmaciesQuery()
	const inventoryQuery = useInventoryListQuery()
	const inventoryLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (inventoryQuery.isError) {
			if (!inventoryLoadErrorNotified.current) {
				inventoryLoadErrorNotified.current = true
				toast({
					title: "Failed to load inventory",
					description: "Could not load inventory from the API.",
					variant: "destructive",
				})
			}
		} else {
			inventoryLoadErrorNotified.current = false
		}
	}, [inventoryQuery.isError, toast])

	const productsLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (productsQueryError) {
			if (!productsLoadErrorNotified.current) {
				productsLoadErrorNotified.current = true
				toast({
					title: "Failed to load products",
					description: "Product names in the inventory table may be missing.",
					variant: "destructive",
				})
			}
		} else {
			productsLoadErrorNotified.current = false
		}
	}, [productsQueryError, toast])

	const pharmaciesLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (pharmaciesQueryError) {
			if (!pharmaciesLoadErrorNotified.current) {
				pharmaciesLoadErrorNotified.current = true
				toast({
					title: "Failed to load pharmacies",
					description: "Pharmacy names in the inventory table may be missing.",
					variant: "destructive",
				})
			}
		} else {
			pharmaciesLoadErrorNotified.current = false
		}
	}, [pharmaciesQueryError, toast])

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
				header: ({ column }) => <SortableHeader column={column} label="Product" />,
				cell: ({ row }) => {
					const item = row.original
					const canDelegateDelete = typeof onDeleteRow === "function"
					return (
						<div className="flex min-w-0 items-center gap-2">
							<span className="min-w-0 truncate font-medium">{item.productName}</span>
							{row.getIsSelected() ? (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
									aria-label="Delete inventory row"
									onClick={async e => {
										e.stopPropagation()
										if (canDelegateDelete) {
											onDeleteRow(item)
											return
										}
										try {
											await deleteMutation.mutateAsync(item.id)
											toast({ title: "Inventory row deleted" })
										} catch (err) {
											toast({
												title: "Delete failed",
												description: err instanceof Error ? err.message : "Unknown error",
												variant: "destructive",
											})
										}
									}}
								>
								</Button>
							) : null}
						</div>
					)
				},
			},
			{
				accessorKey: "variantLabelDisplay",
				header: ({ column }) => <SortableHeader column={column} label="Variant" />,
				cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.variantLabelDisplay}</span>,
			},
			{
				accessorKey: "quantity",
				header: ({ column }) => <SortableHeader column={column} label="Qty" />,
				cell: ({ row }) => <span className="font-semibold">{row.original.quantity}</span>,
			},
			{
				accessorKey: "priceDisplay",
				header: ({ column }) => <SortableHeader column={column} label="Price" />,
			},
			{
				accessorKey: "discountDisplay",
				header: ({ column }) => <SortableHeader column={column} label="Discount" />,
			},
			{
				id: "available",
				accessorFn: row => (row.isAvailable ? 1 : 0),
				header: ({ column }) => <SortableHeader column={column} label="Available" />,
				cell: ({ row }) => (row.original.isAvailable ? "Yes" : "No"),
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
					const item = row.original
					const canDelegateEdit = typeof onEditRow === "function"
					const canDelegateDelete = typeof onDeleteRow === "function"
					return (
						<div className="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger>
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

	const quickEditToolbar =
		editing && !onEditRow ? (
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

	const toolbarLeft = quickEditToolbar ? (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">{quickEditToolbar}</div>
	) : null

	return (
		<DataTable
			data={rows}
			columns={columns}
			toolbarLeft={toolbarLeft}
			isLoading={inventoryQuery.isLoading}
			errorText={inventoryQuery.isError ? "Failed to load inventory." : null}
			searchPlaceholder="Search inventory..."
			getRowId={row => row.id}
			onSelectedRowsChange={rows => {
				onSelectionChange?.(rows)
			}}
			selectionClearKey={selectionClearKey}
		/>
	)
}

