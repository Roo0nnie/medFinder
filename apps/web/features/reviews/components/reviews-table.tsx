"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Star, Trash2 } from "lucide-react"

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/components/ui/dialog"
import { Separator } from "@/core/components/ui/separator"
import { usePharmacyReviewsQuery, type PharmacyReview } from "@/features/reviews/api/reviews.hooks"

type ReviewRow = PharmacyReview & {
	customerName?: string
	avatarUrl?: string | null
	avatarFallback?: string
}

export type ReviewsTableProps = {
	onDelete?: (reviewId: string) => void
	onDeleteMany?: (reviewIds: string[]) => void
	selectionClearKey?: number | string
}

export function ReviewsTable({ onDelete, onDeleteMany, selectionClearKey }: ReviewsTableProps) {
	const [ratingFilter, setRatingFilter] = useState<string>("")
	const [selectedRows, setSelectedRows] = useState<ReviewRow[]>([])
	const [detailsOpen, setDetailsOpen] = useState(false)
	const [reviewForDetails, setReviewForDetails] = useState<ReviewRow | null>(null)
	const selectedRating = ratingFilter ? Number(ratingFilter) : undefined

	const reviewsQuery = usePharmacyReviewsQuery(undefined, selectedRating, { enabled: true })

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
				accessorFn: row => (row.customerName ?? "").toLowerCase(),
				header: ({ column }) => <SortableHeader column={column} label="Customer" />,
				cell: ({ row }) => {
					const r = row.original
					return (
						<div className="flex min-w-0 items-center gap-2">
							{r.avatarUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={r.avatarUrl}
									alt={r.customerName || "Customer"}
									className="h-8 w-8 shrink-0 rounded-full object-cover"
								/>
							) : (
								<div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
									{r.avatarFallback}
								</div>
							)}
							<span className="min-w-0 truncate text-sm font-medium">{r.customerName}</span>
							{row.getIsSelected() && onDelete ? (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
									aria-label="Delete review"
									onClick={e => {
										e.stopPropagation()
										onDelete(r.id)
									}}
								>
								</Button>
							) : null}
						</div>
					)
				},
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Created" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground text-sm">
						{row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—"}
					</span>
				),
			},
			{
				id: "rating",
				accessorFn: row => row.rating ?? 0,
				header: ({ column }) => <SortableHeader column={column} label="Rating" />,
				cell: ({ row }) => <span className="font-semibold">{row.original.rating}/5</span>,
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
									<DropdownMenuItem
										onClick={() => {
											setReviewForDetails(r)
											setDetailsOpen(true)
										}}
									>
										<Eye className="mr-2 h-4 w-4" />
										View details
									</DropdownMenuItem>
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
		[onDelete]
	)

	const showBulkDelete = Boolean(onDeleteMany && selectedRows.length > 0)
	const toolbarAboveSearch =
		showBulkDelete && onDeleteMany ? (
			<Button
				variant="destructive"
				size="sm"
				className="h-8"
				onClick={() => onDeleteMany(selectedRows.map(r => r.id))}
			>
				<Trash2 className="mr-2 h-4 w-4" />
				Delete {selectedRows.length} {selectedRows.length === 1 ? "review" : "reviews"}
			</Button>
		) : null

	const toolbarRight = (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
			<Select value={ratingFilter} onValueChange={v => setRatingFilter(v ?? "")}>
				<SelectTrigger className="h-8 w-full sm:w-40">
					<div className="flex min-w-0 items-center gap-2">
						<Star className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<SelectValue />
					</div>
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
		<>
			<DataTable
				data={rows}
				columns={columns}
				toolbarAboveSearch={toolbarAboveSearch}
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
				getRowId={row => row.id}
				onSelectedRowsChange={setSelectedRows}
				selectionClearKey={selectionClearKey}
			/>

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
									<div className="text-muted-foreground text-xs">Customer</div>
									<div className="text-sm font-medium">{reviewForDetails.customerName ?? "Customer"}</div>
								</div>
								<div>
									<div className="text-muted-foreground text-xs">Rating</div>
									<div className="text-sm font-medium">{reviewForDetails.rating}/5</div>
								</div>
								<div className="sm:col-span-2">
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
		</>
	)
}

