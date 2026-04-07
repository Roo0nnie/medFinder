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
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/core/components/ui/alert-dialog"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
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
import { useToast } from "@/core/components/ui/use-toast"
import { cn } from "@/core/lib/utils"
import { useCreateDeletionRequestMutation } from "@/features/deletion-requests/api/deletion-requests.hooks"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { getStockStatus, type StockStatusKind } from "@/features/products/lib/stock-status"
import {
	useInventoryListQuery,
	useInventoryUpdateMutation,
	useProductCategoriesQuery,
	useProductsQuery,
	type PharmacyInventoryItem,
} from "@/features/products/api/products.hooks"

import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

type StockAlertRow = PharmacyInventoryItem & {
	productName: string
	categoryName: string
	lowStockThreshold: number
	stockKind: StockStatusKind
	stockLabel: string
}

export default function StaffStockAlertsPage() {
	const { toast } = useToast()
	const { data: inventory = [], isLoading, isError } = useInventoryListQuery()
	const { data: products = [] } = useProductsQuery()
	const { data: pharmacies = [] } = useMyPharmaciesQuery()
	const { data: categories = [] } = useProductCategoriesQuery()

	const updateMutation = useInventoryUpdateMutation()
	const createDeletionMutation = useCreateDeletionRequestMutation()

	const [sorting, setSorting] = useState<SortingState>([{ id: "quantity", desc: false }])
	const [searchInput, setSearchInput] = useState("")
	const [globalFilter, setGlobalFilter] = useState("")
	const [pageSize, setPageSize] = useState(10)
	const [pageIndex, setPageIndex] = useState(0)
	const [pharmacyFilter, setPharmacyFilter] = useState<string>("all")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [stockFilter, setStockFilter] = useState<
		"all" | "low" | "ok" | "out" | "unavailable"
	>("all")

	const [editingRow, setEditingRow] = useState<StockAlertRow | null>(null)
	const [editQuantity, setEditQuantity] = useState("")
	const [editPrice, setEditPrice] = useState("")
	const [editAvailable, setEditAvailable] = useState(true)

	const [deleteRequestRow, setDeleteRequestRow] = useState<StockAlertRow | null>(null)
	const [deleteReason, setDeleteReason] = useState("")

	const productMap = useMemo(
		() =>
			new Map(
				products.map(p => [
					p.id,
					{
						name: p.name,
						categoryId: p.categoryId,
						lowStockThreshold: p.lowStockThreshold ?? 5,
					},
				])
			),
		[products]
	)
	const pharmacyMap = useMemo(() => new Map(pharmacies.map(p => [p.id, p.name])), [pharmacies])
	const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories])

	const rows: StockAlertRow[] = useMemo(() => {
		return inventory.map(inv => {
			const info = productMap.get(inv.productId)
			const productName = info?.name ?? inv.productId
			const categoryName = info ? categoryMap.get(info.categoryId) ?? "" : ""
			const lowStockThreshold = info?.lowStockThreshold ?? 5
			const st = getStockStatus({
				quantity: inv.quantity,
				isAvailable: inv.isAvailable,
				lowStockThreshold,
			})
			return {
				...inv,
				productName,
				categoryName,
				lowStockThreshold,
				stockKind: st.kind,
				stockLabel: st.label,
			}
		})
	}, [inventory, productMap, categoryMap])

	const pharmacyOptions = useMemo(() => {
		const ids = new Set(rows.map(r => r.pharmacyId))
		return pharmacies.filter(p => ids.has(p.id))
	}, [rows, pharmacies])

	const filteredRows = useMemo(() => {
		let list = rows
		if (pharmacyFilter !== "all") {
			list = list.filter(r => r.pharmacyId === pharmacyFilter)
		}
		if (categoryFilter !== "all") {
			list = list.filter(r => productMap.get(r.productId)?.categoryId === categoryFilter)
		}
		if (stockFilter === "low") {
			list = list.filter(r => r.stockKind === "low_stock")
		} else if (stockFilter === "ok") {
			list = list.filter(r => r.stockKind === "in_stock")
		} else if (stockFilter === "out") {
			list = list.filter(r => r.stockKind === "out_of_stock")
		} else if (stockFilter === "unavailable") {
			list = list.filter(r => r.stockKind === "not_for_sale")
		}
		return list
	}, [rows, pharmacyFilter, categoryFilter, stockFilter, productMap])

	const columns = useMemo<ColumnDef<StockAlertRow>[]>(
		() => [
			{
				accessorKey: "productName",
				header: "Product",
				cell: ({ row }) => (
					<span className="font-medium">{row.original.productName}</span>
				),
			},
			{
				id: "pharmacy",
				header: "Pharmacy",
				accessorFn: row => pharmacyMap.get(row.pharmacyId) ?? row.pharmacyId,
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{pharmacyMap.get(row.original.pharmacyId) ?? row.original.pharmacyId}
					</span>
				),
			},
			{
				id: "category",
				header: "Category",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.categoryName || "—"}</span>
				),
			},
			{
				id: "variant",
				header: "Variant",
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{row.original.variantLabel ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "quantity",
				header: "Quantity",
				cell: ({ row }) => row.original.quantity,
			},
			{
				accessorKey: "price",
				header: "Price",
				cell: ({ row }) => row.original.price,
			},
			{
				id: "lowStock",
				header: "Stock",
				cell: ({ row }) => {
					const k = row.original.stockKind
					return (
						<Badge
							variant="outline"
							className={cn(
								"border-0",
								k === "not_for_sale" && "bg-muted text-muted-foreground",
								k === "out_of_stock" && "bg-destructive/15 text-destructive",
								k === "low_stock" &&
									"bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
								k === "in_stock" &&
									"bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
							)}
						>
							{row.original.stockLabel}
						</Badge>
					)
				},
			},
			{
				id: "actions",
				header: () => <span className="text-right">Actions</span>,
				cell: ({ row }) => {
					const r = row.original
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
									<DropdownMenuItem onClick={() => openEdit(r)}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit stock
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => openRequestDelete(r)}
										className="text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Request delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[pharmacyMap, openEdit, openRequestDelete]
	)

	function openEdit(r: StockAlertRow) {
		setEditingRow(r)
		setEditQuantity(String(r.quantity))
		setEditPrice(r.price ?? "0")
		setEditAvailable(r.isAvailable)
	}

	function openRequestDelete(r: StockAlertRow) {
		setDeleteRequestRow(r)
		setDeleteReason("")
	}

	const table = useReactTable({
		data: filteredRows,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, _columnId, filterValue) => {
			if (!filterValue || typeof filterValue !== "string") return true
			const v = filterValue.toLowerCase().trim()
			if (!v) return true
			const name = (row.original.productName ?? "").toLowerCase()
			const pharmacy = (pharmacyMap.get(row.original.pharmacyId) ?? "").toLowerCase()
			return name.includes(v) || pharmacy.includes(v)
		},
		state: {
			sorting,
			globalFilter,
			pagination: { pageIndex, pageSize },
		},
		initialState: {
			sorting: [{ id: "quantity", desc: false }],
		},
	})

	useEffect(() => {
		const t = setTimeout(() => setGlobalFilter(searchInput), 300)
		return () => clearTimeout(t)
	}, [searchInput])

	useEffect(() => {
		table.setPageIndex(0)
	}, [pharmacyFilter, categoryFilter, stockFilter])

	const handleSaveEdit = async () => {
		if (!editingRow) return
		const q = parseInt(editQuantity, 10)
		const p = parseFloat(editPrice)
		if (Number.isNaN(q) || q < 0 || Number.isNaN(p) || p < 0) {
			toast({
				title: "Validation",
				description: "Quantity and price must be non-negative numbers.",
				variant: "destructive",
			})
			return
		}
		try {
			await updateMutation.mutateAsync({
				id: editingRow.id,
				quantity: q,
				price: String(p),
				isAvailable: editAvailable,
			})
			toast({ title: "Stock updated" })
			setEditingRow(null)
		} catch (e) {
			toast({
				title: "Update failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const handleSubmitDeleteRequest = async () => {
		if (!deleteRequestRow) return
		try {
			await createDeletionMutation.mutateAsync({
				productId: deleteRequestRow.productId,
				pharmacyId: deleteRequestRow.pharmacyId,
				reason: deleteReason.trim() || undefined,
			})
			toast({ title: "Deletion request submitted. Owner approval required." })
			setDeleteRequestRow(null)
			setDeleteReason("")
		} catch (e) {
			toast({
				title: "Request failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const pageCount = table.getPageCount()
	const totalFiltered = filteredRows.length

	return (
		<DashboardLayout role="staff">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Stock Alerts</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Update product stock for your assigned pharmacies. Request product deletion for owner
						approval.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">Show</span>
							<Select
								value={String(pageSize)}
								onValueChange={v => {
									setPageSize(Number(v))
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
								value={pharmacyFilter}
								onValueChange={v => {
									setPharmacyFilter(v)
									setPageIndex(0)
								}}
							>
								<SelectTrigger className="h-8 min-w-32 sm:w-40">
									<SelectValue placeholder="Pharmacy" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All pharmacies</SelectItem>
									{pharmacyOptions.map(p => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={categoryFilter}
								onValueChange={v => {
									setCategoryFilter(v)
									setPageIndex(0)
								}}
							>
								<SelectTrigger className="h-8 min-w-32 sm:w-40">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All categories</SelectItem>
									{categories.map(c => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={stockFilter}
								onValueChange={v => {
									setStockFilter(v as "all" | "low" | "ok" | "out" | "unavailable")
									setPageIndex(0)
								}}
							>
								<SelectTrigger className="h-8 min-w-32 sm:w-40">
									<SelectValue placeholder="Stock" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All stock</SelectItem>
									<SelectItem value="low">Low stock</SelectItem>
									<SelectItem value="ok">In stock</SelectItem>
									<SelectItem value="out">Out of stock</SelectItem>
									<SelectItem value="unavailable">Not for sale</SelectItem>
								</SelectContent>
							</Select>
							<Input
								placeholder="Search products..."
								value={searchInput}
								onChange={e => {
									setSearchInput(e.target.value)
									setPageIndex(0)
								}}
								className="h-8 w-full sm:w-64"
							/>
						</div>
					</div>

					{isLoading && (
						<p className="text-muted-foreground mt-3 text-sm">Loading inventory...</p>
					)}
					{isError && (
						<p className="text-destructive mt-3 text-sm">Failed to load inventory.</p>
					)}

					<div className="mt-4 overflow-x-auto">
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
								{!isLoading && !isError && table.getRowModel().rows.length > 0 ? (
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
											No inventory found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-muted-foreground text-sm">
							{totalFiltered > 0 ? (
								<>
									Showing {pageIndex * pageSize + 1} to{" "}
									{Math.min((pageIndex + 1) * pageSize, totalFiltered)} of {totalFiltered}{" "}
									items
								</>
							) : (
								"No items to display"
							)}
						</p>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => setPageIndex(i => Math.max(i - 1, 0))}
								disabled={pageIndex === 0}
								aria-label="Previous page"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							{Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
								<Button
									key={p}
									variant={pageIndex === p - 1 ? "default" : "outline"}
									size="icon"
									className="h-8 w-8"
									onClick={() => setPageIndex(p - 1)}
									aria-label={`Page ${p}`}
								>
									{p}
								</Button>
							))}
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => setPageIndex(i => Math.min(i + 1, pageCount - 1))}
								disabled={pageIndex >= pageCount - 1 || pageCount === 0}
								aria-label="Next page"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			<Dialog open={!!editingRow} onOpenChange={open => !open && setEditingRow(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit stock</DialogTitle>
					</DialogHeader>
					{editingRow && (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								{editingRow.productName} · {pharmacyMap.get(editingRow.pharmacyId)}
							</p>
							<div className="space-y-2">
								<Label htmlFor="edit-qty">Quantity</Label>
								<Input
									id="edit-qty"
									type="number"
									min={0}
									value={editQuantity}
									onChange={e => setEditQuantity(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-price">Price</Label>
								<Input
									id="edit-price"
									type="number"
									min={0}
									step="0.01"
									value={editPrice}
									onChange={e => setEditPrice(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-available">Available</Label>
								<Select
									value={editAvailable ? "true" : "false"}
									onValueChange={v => setEditAvailable(v === "true")}
								>
									<SelectTrigger id="edit-available">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="true">Yes</SelectItem>
										<SelectItem value="false">No</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingRow(null)}>
							Cancel
						</Button>
						<Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteRequestRow}
				onOpenChange={open => {
					if (!open) {
						setDeleteRequestRow(null)
						setDeleteReason("")
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Request product deletion</DialogTitle>
					</DialogHeader>
					{deleteRequestRow && (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								Request removal of this product. The owner must approve before it is deleted.
							</p>
							<p className="font-medium">
								{deleteRequestRow.productName} ·{" "}
								{pharmacyMap.get(deleteRequestRow.pharmacyId)}
							</p>
							<div className="space-y-2">
								<Label htmlFor="delete-reason">Reason (optional)</Label>
								<Input
									id="delete-reason"
									value={deleteReason}
									onChange={e => setDeleteReason(e.target.value)}
									placeholder="e.g. Discontinued, out of stock permanently"
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteRequestRow(null)
								setDeleteReason("")
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleSubmitDeleteRequest}
							disabled={createDeletionMutation.isPending}
						>
							Submit request
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardLayout>
	)
}
