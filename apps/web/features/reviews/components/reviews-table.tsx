"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { usePharmacyReviewsQuery, type PharmacyReview } from "@/features/reviews/api/reviews.hooks"

type ReviewRow = PharmacyReview & {
	customerName?: string
	avatarUrl?: string | null
	avatarFallback?: string
}

export type ReviewsTableProps = {
	onDelete?: (reviewId: string) => void
}

export function ReviewsTable({ onDelete }: ReviewsTableProps) {
	const { data: pharmacies } = useMyPharmaciesQuery()
	const [pharmacyId, setPharmacyId] = useState<string>("")
	const [ratingFilter, setRatingFilter] = useState<string>("")
	const selectedRating = ratingFilter ? Number(ratingFilter) : undefined

	const reviewsQuery = usePharmacyReviewsQuery(pharmacyId || undefined, selectedRating, { enabled: true })

	const rows: ReviewRow[] = useMemo(() => {
		const list = reviewsQuery.data ?? []
		return list.map(r => {
			const name =
				r.user?.firstName || r.user?.lastName
					? `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim()
					: "Customer"
			const fallback = r.user?.firstName?.[0] ?? r.user?.lastName?.[0] ?? "?"
			return {
				...r,
				customerName: name,
				avatarUrl: r.user?.image ?? null,
				avatarFallback: fallback,
			}
		})
	}, [reviewsQuery.data])

	const columns = useMemo<ColumnDef<ReviewRow>[]>(
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
				id: "customer",
				header: "Customer",
				cell: ({ row }) => {
					const r = row.original
					return (
						<div className="flex items-center gap-2">
							{r.avatarUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={r.avatarUrl}
									alt={r.customerName || "Customer"}
									className="h-8 w-8 rounded-full object-cover"
								/>
							) : (
								<div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium">
									{r.avatarFallback}
								</div>
							)}
							<span className="text-sm font-medium">{r.customerName}</span>
						</div>
					)
				},
			},
			...(pharmacyId
				? []
				: ([
						{
							accessorKey: "pharmacyName",
							header: "Pharmacy",
							cell: ({ row }) => (
								<span className="text-muted-foreground text-sm">
									{row.original.pharmacyName ?? row.original.pharmacyId}
								</span>
							),
						},
					] as ColumnDef<ReviewRow>[])),
			{
				id: "rating",
				header: "Rating",
				cell: ({ row }) => <span className="font-semibold">{row.original.rating}/5</span>,
			},
			{
				accessorKey: "comment",
				header: "Comment",
				cell: ({ row }) => (
					<div className="max-w-xl">
						<p className="text-sm">{row.original.comment || "No comment provided."}</p>
					</div>
				),
			},
			{
				id: "actions",
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
									{onDelete ? (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => onDelete(r.id)}
												className="text-destructive"
											>
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
		[onDelete, pharmacyId]
	)

	const toolbarRight = (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
			<Select value={pharmacyId} onValueChange={v => setPharmacyId(v ?? "")}>
				<SelectTrigger className="h-8 w-full sm:w-64">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All my pharmacies</SelectItem>
					{pharmacies?.map(ph => (
						<SelectItem key={ph.id} value={ph.id}>
							{ph.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={ratingFilter} onValueChange={v => setRatingFilter(v ?? "")}>
				<SelectTrigger className="h-8 w-full sm:w-40">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All ratings</SelectItem>
					<SelectItem value="5">5 stars</SelectItem>
					<SelectItem value="4">4 stars</SelectItem>
					<SelectItem value="3">3 stars</SelectItem>
					<SelectItem value="2">2 stars</SelectItem>
					<SelectItem value="1">1 star</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DataTable
			data={rows}
			columns={columns}
			toolbarRight={toolbarRight}
			isLoading={reviewsQuery.isLoading}
			errorText={
				reviewsQuery.isError
					? reviewsQuery.error instanceof Error
						? reviewsQuery.error.message
						: "Failed to load reviews."
					: null
			}
			searchPlaceholder="Search reviews..."
		/>
	)
}

