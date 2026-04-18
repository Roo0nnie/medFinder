"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { useToast } from "@/core/components/ui/use-toast"
import {
	useAdminBrandDeleteMutation,
	useAdminBrandsQuery,
	type AdminBrandRow,
} from "@/features/brands/api/brands.hooks"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"

export default function AdminBrandsPage() {
	const { toast } = useToast()
	const query = useAdminBrandsQuery()
	const deleteMutation = useAdminBrandDeleteMutation()

	const columns: ColumnDef<AdminBrandRow>[] = [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
		},
		{
			accessorKey: "normalizedName",
			header: "Normalized",
			cell: ({ row }) => (
				<span className="text-muted-foreground font-mono text-xs">{row.original.normalizedName}</span>
			),
		},
		{
			accessorKey: "ownerCount",
			header: "Owners",
		},
		{
			accessorKey: "productCount",
			header: "Products",
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
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-destructive disabled:opacity-40"
						disabled={!canDelete || deleteMutation.isPending}
						title={
							canDelete
								? "Delete unused brand"
								: "Cannot delete while linked to owners or products"
						}
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
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)
			},
		},
	]

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
							data={query.data ?? []}
							columns={columns}
							isLoading={query.isLoading}
							errorText={query.isError ? "Failed to load brands." : null}
							searchPlaceholder="Search brands…"
						/>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
