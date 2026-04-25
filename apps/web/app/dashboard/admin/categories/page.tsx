"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { Eye, MoreHorizontal, User } from "lucide-react"

import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog"
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
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { useAdminCategoriesQuery, type AdminCategoryRow } from "@/features/admin/api/admin.hooks"

type RxFilter = "all" | "rx" | "otc"

export default function AdminCategoriesPage() {
	const [rxFilter, setRxFilter] = useState<RxFilter>("all")
	const [viewOpen, setViewOpen] = useState(false)
	const [viewCategory, setViewCategory] = useState<AdminCategoryRow | null>(null)
	const query = useAdminCategoriesQuery({ rx: rxFilter === "all" ? undefined : rxFilter === "rx" })

	const openView = useCallback((category: AdminCategoryRow) => {
		setViewCategory(category)
		setViewOpen(true)
	}, [])

	const columns = useMemo<ColumnDef<AdminCategoryRow>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Category" />,
				cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
			},
			{
				accessorKey: "parentName",
				header: ({ column }) => <SortableHeader column={column} label="Parent" />,
				cell: ({ row }) => row.original.parentName ?? "—",
			},
			{
				accessorKey: "ownerName",
				header: ({ column }) => <SortableHeader column={column} label="Owner" />,
				cell: ({ row }) => (
					<div className="flex min-w-0 items-center gap-2">
						<User className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<span className="truncate">{row.original.ownerName || row.original.ownerId}</span>
					</div>
				),
			},
			{
				accessorKey: "requiresPrescription",
				header: ({ column }) => <SortableHeader column={column} label="Rx" />,
				cell: ({ row }) => (row.original.requiresPrescription ? "Yes" : "No"),
			},
			{
				accessorKey: "productCount",
				header: ({ column }) => <SortableHeader column={column} label="Products" />,
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
				cell: ({ row }) => (
					<div className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => openView(row.original)}>
									<Eye className="mr-2 h-4 w-4" aria-hidden />
									View details
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => navigator.clipboard.writeText(row.original.id)}
								>
									Copy category id
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => navigator.clipboard.writeText(row.original.ownerId)}
								>
									Copy owner id
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				),
			},
		],
		[openView]
	)

	const toolbarRight = (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select value={rxFilter} onValueChange={v => setRxFilter((v ?? "all") as RxFilter)}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<span className="truncate">
						{rxFilter === "all" ? "All" : rxFilter === "rx" ? "Rx only" : "OTC only"}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All</SelectItem>
					<SelectItem value="rx">Rx only</SelectItem>
					<SelectItem value="otc">OTC only</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DashboardLayout role="admin">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Read-only monitoring view of categories across owners.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold">Category catalog</h2>
								<p className="text-muted-foreground text-sm">Filters match the owner table UX.</p>
							</div>
						</div>

						<div className="mt-4">
							<DataTable
								data={query.data ?? []}
								columns={columns}
								toolbarRight={toolbarRight}
								isLoading={query.isLoading}
								errorText={query.isError ? "Failed to load categories." : null}
								searchPlaceholder="Search categories…"
								getRowId={row => row.id}
							/>
						</div>
					</CardContent>
				</Card>

				<Dialog
					open={viewOpen}
					onOpenChange={open => {
						setViewOpen(open)
						if (!open) setViewCategory(null)
					}}
				>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Category details</DialogTitle>
						</DialogHeader>

						{viewCategory ? (
							<div className="grid gap-3 text-sm">
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Name</span>
									<span className="col-span-2 font-medium">{viewCategory.name}</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">ID</span>
									<span className="col-span-2 break-all font-mono text-xs">{viewCategory.id}</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Owner</span>
									<span className="col-span-2 break-all">
										{viewCategory.ownerName ? (
											<span className="font-medium">{viewCategory.ownerName}</span>
										) : (
											"—"
										)}
									</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Parent</span>
									<span className="col-span-2">{viewCategory.parentName ?? "—"}</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Description</span>
									<span className="col-span-2 max-h-32 overflow-auto whitespace-pre-wrap wrap-break-word">
										{viewCategory.description?.trim() ? viewCategory.description : "—"}
									</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Requires Rx</span>
									<span className="col-span-2">
										{viewCategory.requiresPrescription ? "Yes" : "No"}
									</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Products</span>
									<span className="col-span-2">{viewCategory.productCount}</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Created</span>
									<span className="col-span-2">
										{viewCategory.createdAt ? new Date(viewCategory.createdAt).toLocaleString() : "—"}
									</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<span className="text-muted-foreground col-span-1">Updated</span>
									<span className="col-span-2">
										{viewCategory.updatedAt
											? new Date(viewCategory.updatedAt).toLocaleString()
											: "—"}
									</span>
								</div>
							</div>
						) : null}
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	)
}

