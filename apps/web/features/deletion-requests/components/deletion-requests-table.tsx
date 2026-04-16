"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ThumbsDown, ThumbsUp } from "lucide-react"

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
import { useDeletionRequestsQuery, type DeletionRequest } from "@/features/deletion-requests/api/deletion-requests.hooks"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { useProductsQuery } from "@/features/products/api/products.hooks"
import { useUsersQuery } from "@/features/users/api/users.hooks"

type DeletionRequestRow = DeletionRequest & {
	productName?: string
	pharmacyName?: string
	requestedByName?: string
	dateLabel?: string
}

export type DeletionRequestsTableProps = {
	onApprove?: (req: DeletionRequest) => void
	onReject?: (req: DeletionRequest) => void
}

export function DeletionRequestsTable({ onApprove, onReject }: DeletionRequestsTableProps) {
	const requestsQuery = useDeletionRequestsQuery({ status: "pending" })
	const { data: products = [] } = useProductsQuery()
	const { data: pharmacies = [] } = useMyPharmaciesQuery()
	const { data: users = [] } = useUsersQuery()

	const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products])
	const pharmacyMap = useMemo(() => new Map(pharmacies.map(p => [p.id, p.name])), [pharmacies])
	const userMap = useMemo(() => {
		const m = new Map<string, string>()
		for (const u of users as { id?: string; firstName?: string; lastName?: string; email?: string }[]) {
			if (!u?.id) continue
			const name =
				u.firstName || u.lastName ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : u.email ?? u.id
			m.set(u.id, name)
		}
		return m
	}, [users])

	const rows: DeletionRequestRow[] = useMemo(() => {
		const list = requestsQuery.data ?? []
		return list.map(r => ({
			...r,
			productName: productMap.get(r.productId) ?? r.productId,
			pharmacyName: pharmacyMap.get(r.pharmacyId) ?? r.pharmacyId,
			requestedByName: userMap.get(r.requestedBy) ?? r.requestedBy,
			dateLabel: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
		}))
	}, [requestsQuery.data, productMap, pharmacyMap, userMap])

	const columns = useMemo<ColumnDef<DeletionRequestRow>[]>(
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
				cell: ({ row }) => <span className="font-medium">{row.original.productName}</span>,
			},
			{
				accessorKey: "pharmacyName",
				header: ({ column }) => <SortableHeader column={column} label="Pharmacy" />,
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.pharmacyName}</span>,
			},
			{
				accessorKey: "requestedByName",
				header: ({ column }) => <SortableHeader column={column} label="Requested by" />,
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.requestedByName}</span>,
			},
			{
				accessorKey: "reason",
				header: ({ column }) => <SortableHeader column={column} label="Reason" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground inline-block max-w-[200px] truncate">
						{row.original.reason || "—"}
					</span>
				),
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Date" />,
				cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.dateLabel}</span>,
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const req = row.original
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
									{onReject ? (
										<DropdownMenuItem onClick={() => onReject(req)}>
											<ThumbsDown className="mr-2 h-4 w-4" />
											Reject
										</DropdownMenuItem>
									) : null}
									{onApprove ? (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => onApprove(req)} className="text-destructive">
												<ThumbsUp className="mr-2 h-4 w-4" />
												Approve & delete
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
		[onApprove, onReject]
	)

	return (
		<DataTable
			data={rows}
			columns={columns}
			isLoading={requestsQuery.isLoading}
			errorText={requestsQuery.isError ? "Failed to load deletion requests." : null}
			searchPlaceholder="Search deletion requests..."
		/>
	)
}

