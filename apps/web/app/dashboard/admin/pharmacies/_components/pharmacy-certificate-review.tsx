"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { CalendarRange, ExternalLink } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/core/components/ui/select"
import { Textarea } from "@/core/components/ui/textarea"
import { useToast } from "@/core/components/ui/use-toast"
import { useAdminPharmaciesQuery, type AdminPharmacyRow } from "@/features/admin/api/admin.hooks"
import { usePharmacyCertificateReviewMutation } from "@/features/pharmacies/api/pharmacies.hooks"

export type VerificationStatus = "pending" | "approved" | "rejected"

type PeriodFilter = "all" | "today" | "week" | "month" | "year"

function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function startOfMonth(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function startOfYear(d: Date) {
	return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0)
}

function periodToFrom(period: PeriodFilter, now: Date) {
	if (period === "all") return null
	if (period === "today") return startOfDay(now)
	if (period === "week") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0)
	if (period === "month") return startOfMonth(now)
	return startOfYear(now)
}

export function PharmacyCertificateReview({ status }: { status: VerificationStatus }) {
	const { toast } = useToast()
	const qc = useQueryClient()
	const { data, isLoading, isError } = useAdminPharmaciesQuery({ certificateStatus: status })
	const reviewMutation = usePharmacyCertificateReviewMutation()

	const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogTarget, setDialogTarget] = useState<{
		pharmacy: AdminPharmacyRow
		nextStatus: "approved" | "rejected"
	} | null>(null)
	const [remark, setRemark] = useState("")

	const dialogTitle = dialogTarget
		? dialogTarget.nextStatus === "approved"
			? "Approve certificate"
			: "Reject certificate"
		: "Review certificate"

	const dialogDescription = dialogTarget
		? `Add a review note before marking this certificate as ${dialogTarget.nextStatus}.`
		: "Add a review note before submitting your decision."

	const openDialog = (pharmacy: AdminPharmacyRow, nextStatus: "approved" | "rejected") => {
		setDialogTarget({ pharmacy, nextStatus })
		setRemark("")
		setDialogOpen(true)
	}

	const handleSubmit = async () => {
		if (!dialogTarget) return
		const note = remark.trim()
		if (!note) {
			toast({
				title: "Review note required",
				description: "Please enter a remark before continuing.",
				variant: "destructive",
			})
			return
		}
		try {
			await reviewMutation.mutateAsync({
				id: dialogTarget.pharmacy.id,
				status: dialogTarget.nextStatus,
				reviewNote: note,
			})
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["admin", "pharmacies"] }),
				qc.invalidateQueries({ queryKey: ["pharmacies"] }),
			])
			setDialogOpen(false)
			setDialogTarget(null)
			toast({ title: `Certificate ${dialogTarget.nextStatus}` })
		} catch (error: unknown) {
			toast({
				title: "Review failed",
				description: error instanceof Error ? error.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const periodLabel =
		periodFilter === "all"
			? "All time"
			: periodFilter === "today"
				? "Today"
				: periodFilter === "week"
					? "This week"
					: periodFilter === "month"
						? "This month"
						: "This year"

	const filteredData = useMemo(() => {
		const rows = data ?? []
		const from = periodToFrom(periodFilter, new Date())
		if (!from) return rows

		return rows.filter(r => {
			const dateStr =
				status === "pending"
					? r.certificateSubmittedAt
					: r.certificateReviewedAt ?? r.certificateSubmittedAt
			if (!dateStr) return false
			const dt = new Date(dateStr)
			return !Number.isNaN(dt.valueOf()) && dt >= from
		})
	}, [data, periodFilter, status])

	const columns = useMemo<ColumnDef<AdminPharmacyRow>[]>(
		() => {
			const baseCols: ColumnDef<AdminPharmacyRow>[] = [
				{
					accessorKey: "name",
					header: ({ column }) => <SortableHeader column={column} label="Pharmacy" />,
					cell: ({ row }) => (
						<div className="min-w-0">
							<div className="truncate font-medium">{row.original.name}</div>
							<div className="text-muted-foreground truncate text-xs">{row.original.ownerName}</div>
						</div>
					),
				},
				{
					accessorKey: "certificateNumber",
					header: ({ column }) => <SortableHeader column={column} label="Certificate #" />,
					cell: ({ row }) => row.original.certificateNumber ?? "—",
				},
				{
					accessorKey: status === "pending" ? "certificateSubmittedAt" : "certificateReviewedAt",
					header: ({ column }) => (
						<SortableHeader column={column} label={status === "pending" ? "Submitted" : "Reviewed"} />
					),
					cell: ({ row }) => {
						const dt = status === "pending" ? row.original.certificateSubmittedAt : row.original.certificateReviewedAt
						return dt ? new Date(dt).toLocaleString() : "—"
					},
				},
				{
					accessorKey: "customerVisible",
					header: ({ column }) => <SortableHeader column={column} label="Visible" />,
					cell: ({ row }) => (row.original.customerVisible ? "Yes" : "No"),
				},
			]

			if (status !== "pending") {
				baseCols.push({
					id: "reviewNote",
					header: () => <span className="text-xs font-semibold">Review note</span>,
					enableSorting: false,
					cell: ({ row }) => (
						<div className="text-muted-foreground min-w-52 whitespace-pre-wrap text-sm">
							{row.original.certificateReviewNote?.trim() ? row.original.certificateReviewNote : "—"}
						</div>
					),
				})
			}

			baseCols.push({
				id: "actions",
				header: () => (
					<div className="text-right">
						<span className="text-xs font-semibold">Action</span>
					</div>
				),
				enableSorting: false,
				cell: ({ row }) => {
					const pharmacy = row.original
					const canApprove = status === "pending" || status === "rejected"
					const canReject = status === "pending" || status === "approved"
					return (
						<div className="flex justify-end gap-2">
							{pharmacy.certificateFileUrl ? (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => window.open(pharmacy.certificateFileUrl ?? "", "_blank", "noreferrer")}
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									View
								</Button>
							) : null}
							{canApprove ? (
								<Button
									size="sm"
									onClick={() => openDialog(pharmacy, "approved")}
									disabled={reviewMutation.isPending}
								>
									Approve
								</Button>
							) : null}
							{canReject ? (
								<Button
									size="sm"
									variant="destructive"
									onClick={() => openDialog(pharmacy, "rejected")}
									disabled={reviewMutation.isPending}
								>
									Reject
								</Button>
							) : null}
						</div>
					)
				},
			})

			return baseCols
		},
		[reviewMutation.isPending, status]
	)

	const toolbarRight = (
		<div className="w-full sm:w-auto">
			<Select value={periodFilter} onValueChange={v => setPeriodFilter((v ?? "all") as PeriodFilter)}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<div className="flex min-w-0 items-center gap-2">
						<CalendarRange className="text-muted-foreground h-4 w-4 shrink-0" />
						<span className="truncate">{periodLabel}</span>
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All time</SelectItem>
					<SelectItem value="today">Today</SelectItem>
					<SelectItem value="week">This week</SelectItem>
					<SelectItem value="month">This month</SelectItem>
					<SelectItem value="year">This year</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<>
			<Card>
				<CardContent className="p-4 sm:p-6">
					<DataTable
						data={filteredData}
						columns={columns}
						isLoading={isLoading}
						errorText={isError ? "Failed to load pharmacies for review." : null}
						searchPlaceholder="Search pharmacies…"
						getRowId={row => row.id}
						toolbarRight={toolbarRight}
					/>
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={open => setDialogOpen(open)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
						<DialogDescription>{dialogDescription}</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<div className="text-muted-foreground text-xs">
							Pharmacy: <span className="text-foreground font-medium">{dialogTarget?.pharmacy.name ?? "—"}</span>
						</div>
						<Textarea
							value={remark}
							onChange={e => setRemark(e.target.value)}
							placeholder="Write your review note / remark…"
							aria-label="Review note"
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={reviewMutation.isPending}>
								Cancel
							</Button>
						</DialogClose>
						<Button type="button" onClick={() => void handleSubmit()} disabled={reviewMutation.isPending}>
							{reviewMutation.isPending ? "Saving..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

