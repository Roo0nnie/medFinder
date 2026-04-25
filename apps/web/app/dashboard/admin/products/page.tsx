"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { Eye, MoreHorizontal, Package, Pencil, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/core/components/ui/badge"
import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
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
} from "@/core/components/ui/select"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/core/components/ui/carousel"
import { Label } from "@/core/components/ui/label"
import { useToast } from "@/core/components/ui/use-toast"
import { cn } from "@/core/lib/utils"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { useAdminProductsQuery, type AdminProductRow } from "@/features/admin/api/admin.hooks"
import { useAdminBrandsQuery, type AdminBrandRow } from "@/features/brands/api/brands.hooks"
import { useAdminCategoriesQuery, useAdminPharmaciesQuery } from "@/features/admin/api/admin.hooks"
import {
	useProductDeleteMutation,
	useProductDetailQuery,
	useProductUpdateMutation,
} from "@/features/products/api/products.hooks"
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

export default function AdminProductsPage() {
	const q = useAdminProductsQuery()
	const qc = useQueryClient()
	const { toast } = useToast()
	const brandsQ = useAdminBrandsQuery()
	const categoriesQ = useAdminCategoriesQuery()
	const pharmaciesQ = useAdminPharmaciesQuery()
	const deleteMutation = useProductDeleteMutation()
	const updateProductMutation = useProductUpdateMutation()

	const [filterBrandId, setFilterBrandId] = useState("")
	const [filterCategoryId, setFilterCategoryId] = useState("")
	const [filterPharmacyId, setFilterPharmacyId] = useState("")
	const [filterRx, setFilterRx] = useState<"all" | "rx" | "otc">("all")
	const [filterStock, setFilterStock] = useState<"all" | "ok" | "low" | "out">("all")
	const [deleteTarget, setDeleteTarget] = useState<AdminProductRow | null>(null)
	const [viewTarget, setViewTarget] = useState<AdminProductRow | null>(null)
	const [editTarget, setEditTarget] = useState<AdminProductRow | null>(null)
	const [editIsAvailable, setEditIsAvailable] = useState<"yes" | "no">("yes")

	const detailTargetId = (viewTarget ?? editTarget)?.id
	const detailQ = useProductDetailQuery(detailTargetId)

	useEffect(() => {
		if (!editTarget) return
		const current = detailQ.data?.isAvailable
		setEditIsAvailable(current === false ? "no" : "yes")
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editTarget?.id])

	const detailSlides = useMemo(() => {
		const d = detailQ.data
		if (!d?.variants || d.variants.length === 0) return []
		const urls = d.variants.flatMap(v => {
			const list = (v.imageUrls ?? []).map(u => (typeof u === "string" ? u.trim() : "")).filter(Boolean)
			const one = v.imageUrl?.trim()
			return [...list, ...(one ? [one] : [])]
		})
		return Array.from(new Set(urls))
	}, [detailQ.data])

	const brandLabel = !filterBrandId
		? "All brands"
		: (brandsQ.data ?? []).find((b: AdminBrandRow) => b.id === filterBrandId)?.name ?? "Brand"
	const categoryLabel = !filterCategoryId
		? "All categories"
		: (categoriesQ.data ?? []).find(c => c.id === filterCategoryId)?.name ?? "Category"
	const pharmacyLabel = !filterPharmacyId
		? "All pharmacies"
		: (pharmaciesQ.data ?? []).find(p => p.id === filterPharmacyId)?.name ?? "Pharmacy"

	const filtered = useMemo(() => {
		let rows = q.data ?? []
		if (filterBrandId) rows = rows.filter(r => (r.brandId ?? "") === filterBrandId)
		if (filterCategoryId) rows = rows.filter(r => r.categoryId === filterCategoryId)
		if (filterPharmacyId) rows = rows.filter(r => (r.pharmacyId ?? "") === filterPharmacyId)
		if (filterRx !== "all") rows = rows.filter(r => (filterRx === "rx" ? r.requiresPrescription : !r.requiresPrescription))
		if (filterStock !== "all") rows = rows.filter(r => r.stockHealth === filterStock)
		return rows
	}, [q.data, filterBrandId, filterCategoryId, filterPharmacyId, filterRx, filterStock])

	const columns = useMemo<ColumnDef<AdminProductRow>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Product" />,
				cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
			},
			{
				accessorKey: "pharmacyName",
				header: ({ column }) => <SortableHeader column={column} label="Pharmacy" />,
				cell: ({ row }) => row.original.pharmacyName ?? "—",
			},
			{
				accessorKey: "ownerName",
				header: ({ column }) => <SortableHeader column={column} label="Owner" />,
				cell: ({ row }) => row.original.ownerName ?? "—",
			},
			{
				accessorKey: "categoryName",
				header: ({ column }) => <SortableHeader column={column} label="Category" />,
				cell: ({ row }) => row.original.categoryName ?? "—",
			},
			{
				accessorKey: "brandName",
				header: ({ column }) => <SortableHeader column={column} label="Brand" />,
				cell: ({ row }) => row.original.brandName ?? "—",
			},
			{
				accessorKey: "inventoryTotal",
				header: ({ column }) => <SortableHeader column={column} label="Inventory" />,
			},
			{
				accessorKey: "stockHealth",
				header: ({ column }) => <SortableHeader column={column} label="Stock" />,
				cell: ({ row }) => {
					const v = row.original.stockHealth
					const label = v === "ok" ? "OK" : v === "low" ? "Low" : "Out"
					const cls =
						v === "ok"
							? "bg-emerald-500/10 text-emerald-600"
							: v === "low"
								? "bg-amber-500/10 text-amber-700"
								: "bg-rose-500/10 text-rose-600"
					return <Badge className={cls}>{label}</Badge>
				},
			},
			{
				accessorKey: "requiresPrescription",
				header: ({ column }) => <SortableHeader column={column} label="Rx" />,
				cell: ({ row }) => (row.original.requiresPrescription ? "Yes" : "No"),
			},
			{
				accessorKey: "updatedAt",
				header: ({ column }) => <SortableHeader column={column} label="Updated" />,
				cell: ({ row }) =>
					row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : "—",
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
					const p = row.original
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
									<DropdownMenuItem onClick={() => setViewTarget(p)}>
										<Eye className="mr-2 h-4 w-4" />
										View
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setEditTarget(p)}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setDeleteTarget(p)}
										className="text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete product
									</DropdownMenuItem>
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
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select value={filterBrandId} onValueChange={v => setFilterBrandId(v ?? "")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-48">
					<span className="truncate">{brandLabel}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All brands</SelectItem>
					{(brandsQ.data ?? []).map(b => (
						<SelectItem key={b.id} value={b.id}>
							{b.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={filterCategoryId} onValueChange={v => setFilterCategoryId(v ?? "")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-48">
					<span className="truncate">{categoryLabel}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All categories</SelectItem>
					{(categoriesQ.data ?? []).map(c => (
						<SelectItem key={c.id} value={c.id}>
							{c.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={filterPharmacyId} onValueChange={v => setFilterPharmacyId(v ?? "")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-56">
					<span className="truncate">{pharmacyLabel}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All pharmacies</SelectItem>
					{(pharmaciesQ.data ?? []).map(ph => (
						<SelectItem key={ph.id} value={ph.id}>
							{ph.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={filterRx} onValueChange={v => setFilterRx((v ?? "all") as any)}>
				<SelectTrigger className="h-8 w-full min-w-32 sm:w-36">
					<span className="truncate">{filterRx === "all" ? "Rx: all" : filterRx === "rx" ? "Rx only" : "OTC only"}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Rx: all</SelectItem>
					<SelectItem value="rx">Rx only</SelectItem>
					<SelectItem value="otc">OTC only</SelectItem>
				</SelectContent>
			</Select>

			<Select value={filterStock} onValueChange={v => setFilterStock((v ?? "all") as any)}>
				<SelectTrigger className="h-8 w-full min-w-32 sm:w-36">
					<span className="truncate">{filterStock === "all" ? "Stock: all" : `Stock: ${filterStock}`}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Stock: all</SelectItem>
					<SelectItem value="ok">ok</SelectItem>
					<SelectItem value="low">low</SelectItem>
					<SelectItem value="out">out</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Product Monitoring</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Platform-wide monitoring with quick filters (brand/category/pharmacy/Rx/stock).
					</p>
				</div>
				<Card>
					<CardContent className="p-4 sm:p-6">
						<DataTable
							data={filtered}
							columns={columns}
							toolbarRight={toolbarRight}
							isLoading={q.isLoading}
							errorText={q.isError ? "Failed to load products." : null}
							searchPlaceholder="Search products…"
							getRowId={row => row.id}
						/>
					</CardContent>
				</Card>

				<AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete product?</AlertDialogTitle>
							<AlertDialogDescription>
								This will remove the product from the catalog (and related inventory rows). This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={async () => {
									if (!deleteTarget) return
									await deleteMutation.mutateAsync(deleteTarget.id)
									setDeleteTarget(null)
									qc.invalidateQueries({ queryKey: ["admin", "products"] })
								}}
							>
								{deleteMutation.isPending ? "Deleting…" : "Delete"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
					<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Product information</DialogTitle>
						</DialogHeader>
						{detailQ.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading…</p>
						) : detailQ.isError ? (
							<p className="text-muted-foreground text-sm">Failed to load product details.</p>
						) : !detailQ.data ? (
							<p className="text-muted-foreground text-sm">No data.</p>
						) : (
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="sm:col-span-2">
									<div className="bg-muted relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: "56.25%" }}>
										<div className="absolute inset-0">
											{detailSlides.length === 0 ? (
												<div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm">
													<Package className="h-10 w-10 opacity-40" aria-hidden />
													<span>No image</span>
												</div>
											) : detailSlides.length === 1 ? (
												<img
													src={detailSlides[0]}
													alt=""
													loading="lazy"
													decoding="async"
													className="object-contain"
													style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
												/>
											) : (
												<Carousel key={detailTargetId ?? "product"} className="h-full w-full" opts={{ loop: true }}>
													<CarouselContent className="ml-0 h-full">
														{detailSlides.map((url, i) => (
															<CarouselItem key={`${url}-${i}`} className="basis-full pl-0">
																<div className="relative h-full w-full">
																	<img
																		src={url}
																		alt=""
																		loading="lazy"
																		decoding="async"
																		className="object-contain"
																		style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
																	/>
																</div>
															</CarouselItem>
														))}
													</CarouselContent>
													<CarouselPrevious
														type="button"
														className={cn(
															"left-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
														)}
													/>
													<CarouselNext
														type="button"
														className={cn(
															"right-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/30 bg-black/45 text-white hover:bg-black/65 disabled:opacity-30"
														)}
													/>
												</Carousel>
											)}
										</div>
									</div>
								</div>
								<div className="space-y-1">
									<Label>Pharmacy</Label>
									<p className="text-sm">{viewTarget?.pharmacyName ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Owner</Label>
									<p className="text-sm">{viewTarget?.ownerName ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Name</Label>
									<p className="text-sm font-medium">{detailQ.data.name ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Category</Label>
									<p className="text-sm">{detailQ.data.category ?? viewTarget?.categoryName ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Brand</Label>
									<p className="text-sm">{detailQ.data.brandName ?? viewTarget?.brandName ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Generic name</Label>
									<p className="text-sm">{detailQ.data.genericName ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Manufacturer</Label>
									<p className="text-sm">{detailQ.data.manufacturer ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Supplier</Label>
									<p className="text-sm">{detailQ.data.supplier ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<Label>Requires prescription</Label>
									<p className="text-sm">{detailQ.data.requiresPrescription ? "Yes" : "No"}</p>
								</div>
								<div className="space-y-1">
									<Label>Available for sale</Label>
									<p className="text-sm">{detailQ.data.isAvailable === false ? "No" : "Yes"}</p>
								</div>
								<div className="space-y-1">
									<Label>Low stock threshold</Label>
									<p className="text-sm">
										{detailQ.data.lowStockThreshold === null || detailQ.data.lowStockThreshold === undefined
											? "—"
											: String(detailQ.data.lowStockThreshold)}
									</p>
								</div>
								<div className="space-y-1">
									<Label>Updated</Label>
									<p className="text-sm">
										{viewTarget?.updatedAt ? new Date(viewTarget.updatedAt).toLocaleString() : "—"}
									</p>
								</div>
								{detailQ.data.description ? (
									<div className="space-y-1 sm:col-span-2">
										<Label>Description</Label>
										<p className="text-sm whitespace-pre-wrap">{detailQ.data.description}</p>
									</div>
								) : null}
								{detailQ.data.indications ? (
									<div className="space-y-1 sm:col-span-2">
										<Label>Indications</Label>
										<p className="text-sm whitespace-pre-wrap">{detailQ.data.indications}</p>
									</div>
								) : null}
								{detailQ.data.activeIngredients ? (
									<div className="space-y-1 sm:col-span-2">
										<Label>Active ingredients</Label>
										<p className="text-sm whitespace-pre-wrap">{detailQ.data.activeIngredients}</p>
									</div>
								) : null}
							</div>
						)}
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setViewTarget(null)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Edit product</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm">
								Only “Available for sale” can be edited here.
							</p>
							<div className="space-y-1">
								<Label>Available for sale</Label>
								<Select value={editIsAvailable} onValueChange={v => setEditIsAvailable((v as any) ?? "yes")}>
									<SelectTrigger className="h-9 w-full">
										<span>{editIsAvailable === "yes" ? "Yes" : "No"}</span>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="yes">Yes</SelectItem>
										<SelectItem value="no">No</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={async () => {
									if (!editTarget) return
									try {
										await updateProductMutation.mutateAsync({
											id: editTarget.id,
											isAvailable: editIsAvailable === "yes",
										})
										toast({ title: "Product updated" })
										setEditTarget(null)
										qc.invalidateQueries({ queryKey: ["admin", "products"] })
										qc.invalidateQueries({ queryKey: ["product-detail", editTarget.id] })
									} catch (e: unknown) {
										const message = e instanceof Error ? e.message : "Update failed"
										toast({ title: "Update failed", description: message, variant: "destructive" })
									}
								}}
								disabled={updateProductMutation.isPending}
							>
								{updateProductMutation.isPending ? "Saving…" : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	)
}

