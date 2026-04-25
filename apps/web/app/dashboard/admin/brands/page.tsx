"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { useToast } from "@/core/components/ui/use-toast"
import {
	useAdminBrandDeleteMutation,
	useAdminBrandsQuery,
	type AdminBrandRow,
} from "@/features/brands/api/brands.hooks"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
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

export default function AdminBrandsPage() {
	const { toast } = useToast()
	const query = useAdminBrandsQuery()
	const deleteMutation = useAdminBrandDeleteMutation()

	const [deletableFilter, setDeletableFilter] = useState<"all" | "deletable">("all")

	const filteredRows = useMemo(() => {
		const rows = query.data ?? []
		if (deletableFilter === "deletable") {
			return rows.filter(r => r.ownerCount === 0 && r.productCount === 0)
		}
		return rows
	}, [query.data, deletableFilter])

	const columns = useMemo<ColumnDef<AdminBrandRow>[]>(
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
				cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
			},
			{
				accessorKey: "normalizedName",
				header: ({ column }) => <SortableHeader column={column} label="Normalized" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground font-mono text-xs">{row.original.normalizedName}</span>
				),
			},
			{
				accessorKey: "ownerCount",
				header: ({ column }) => <SortableHeader column={column} label="Owners" />,
			},
			{
				accessorKey: "productCount",
				header: ({ column }) => <SortableHeader column={column} label="Products" />,
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
					const b = row.original
					const canDelete = b.ownerCount === 0 && b.productCount === 0
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
										onClick={() => navigator.clipboard.writeText(b.id)}
									>
										Copy brand id
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										disabled={!canDelete || deleteMutation.isPending}
										onClick={async () => {
											try {
												await deleteMutation.mutateAsync(b.id)
												toast({ title: "Brand deleted" })
											} catch (e) {
												toast({
													title: "Delete failed",
													description: e instanceof Error ? e.message : "Unknown error",
													variant: "destructive",
												})
											}
										}}
										className={canDelete ? "text-destructive" : "opacity-60"}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete (unused only)
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[deleteMutation.isPending, toast]
	)

	const toolbarRight = (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select value={deletableFilter} onValueChange={v => setDeletableFilter((v ?? "all") as any)}>
				<SelectTrigger className="h-8 w-full min-w-44 sm:w-48">
					<span className="truncate">{deletableFilter === "all" ? "All brands" : "Deletable only"}</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All brands</SelectItem>
					<SelectItem value="deletable">Deletable only</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Brand catalog</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Global brands and usage. Delete is only allowed when no owner links and no products reference
						the brand.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<DataTable
							data={filteredRows}
							columns={columns}
							toolbarRight={toolbarRight}
							isLoading={query.isLoading}
							errorText={query.isError ? "Failed to load brands." : null}
							searchPlaceholder="Search brands…"
							getRowId={row => row.id}
						/>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
