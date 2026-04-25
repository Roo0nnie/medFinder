"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Eye, MoreHorizontal } from "lucide-react"

import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/components/ui/dialog"
import { Separator } from "@/core/components/ui/separator"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { useAdminReviewsQuery, type AdminReviewRow } from "@/features/admin/api/admin.hooks"

export default function AdminReviewsPage() {
	const q = useAdminReviewsQuery()
	const [detailsOpen, setDetailsOpen] = useState(false)
	const [reviewForDetails, setReviewForDetails] = useState<AdminReviewRow | null>(null)

	const columns = useMemo<ColumnDef<AdminReviewRow>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Time" />,
				cell: ({ row }) =>
					row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—",
			},
			{
				accessorKey: "pharmacyName",
				header: ({ column }) => <SortableHeader column={column} label="Pharmacy" />,
				cell: ({ row }) => row.original.pharmacyName ?? row.original.pharmacyId,
			},
			{
				accessorKey: "userName",
				header: ({ column }) => <SortableHeader column={column} label="Customer" />,
				cell: ({ row }) => row.original.userName,
			},
			{
				accessorKey: "rating",
				header: ({ column }) => <SortableHeader column={column} label="Rating" />,
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				enableSorting: false,
				cell: ({ row }) => {
					const r = row.original
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
											setReviewForDetails(r)
											setDetailsOpen(true)
										}}
									>
										<Eye className="mr-2 h-4 w-4" />
										View details
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

	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Reviews &amp; Ratings</h1>
					<p className="text-muted-foreground mt-2 text-sm">Platform-wide review monitoring.</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<DataTable
							data={q.data ?? []}
							columns={columns}
							isLoading={q.isLoading}
							errorText={q.isError ? "Failed to load reviews." : null}
							searchPlaceholder="Search reviews…"
							getRowId={row => row.id}
						/>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={detailsOpen}
				onOpenChange={open => {
					setDetailsOpen(open)
					if (!open) setReviewForDetails(null)
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Review details</DialogTitle>
						<DialogDescription>Full review information, including description.</DialogDescription>
					</DialogHeader>

					{reviewForDetails ? (
						<div className="space-y-3">
							<div className="grid gap-2 sm:grid-cols-2">
								<div>
									<div className="text-muted-foreground text-xs">Pharmacy</div>
									<div className="text-sm font-medium">
										{reviewForDetails.pharmacyName ?? reviewForDetails.pharmacyId}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground text-xs">Customer</div>
									<div className="text-sm font-medium">{reviewForDetails.userName}</div>
								</div>
								<div>
									<div className="text-muted-foreground text-xs">Rating</div>
									<div className="text-sm font-medium">{reviewForDetails.rating}/5</div>
								</div>
								<div>
									<div className="text-muted-foreground text-xs">Created</div>
									<div className="text-sm">
										{reviewForDetails.createdAt
											? new Date(reviewForDetails.createdAt).toLocaleString()
											: "—"}
									</div>
								</div>
							</div>

							<Separator />

							<div>
								<div className="text-muted-foreground text-xs">Description</div>
								<div className="bg-muted/30 mt-1 rounded-md p-3">
									<p className="text-sm whitespace-pre-wrap">
										{reviewForDetails.comment?.trim() ? reviewForDetails.comment : "—"}
									</p>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</DashboardLayout>
	)
}

