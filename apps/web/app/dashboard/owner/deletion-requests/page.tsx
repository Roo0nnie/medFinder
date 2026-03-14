"use client"

import { useMemo, useState } from "react"

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
import { Button } from "@/core/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { useToast } from "@/core/components/ui/use-toast"
import {
	useDeletionRequestsQuery,
	useDeletionRequestApproveMutation,
	useDeletionRequestRejectMutation,
	type DeletionRequest,
} from "@/features/deletion-requests/api/deletion-requests.hooks"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { useProductsQuery } from "@/features/products/api/products.hooks"
import { useUsersQuery } from "@/features/users/api/users.hooks"

import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerDeletionRequestsPage() {
	const { toast } = useToast()
	const { data: requests = [], isLoading, isError } = useDeletionRequestsQuery({ status: "pending" })
	const { data: products = [] } = useProductsQuery()
	const { data: pharmacies = [] } = useMyPharmaciesQuery()
	const { data: users = [] } = useUsersQuery()

	const approveMutation = useDeletionRequestApproveMutation()
	const rejectMutation = useDeletionRequestRejectMutation()

	const [reviewing, setReviewing] = useState<DeletionRequest | null>(null)
	const [action, setAction] = useState<"approve" | "reject" | null>(null)

	const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products])
	const pharmacyMap = useMemo(() => new Map(pharmacies.map(p => [p.id, p.name])), [pharmacies])
	const userMap = useMemo(() => {
		const m = new Map<string, string>()
		for (const u of users as { id?: string; firstName?: string; lastName?: string; email?: string }[]) {
			if (u?.id) {
				const name =
					u.firstName || u.lastName
						? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
						: u.email ?? u.id
				m.set(u.id, name)
			}
		}
		return m
	}, [users])

	const handleApprove = (req: DeletionRequest) => {
		setReviewing(req)
		setAction("approve")
	}

	const handleReject = (req: DeletionRequest) => {
		setReviewing(req)
		setAction("reject")
	}

	const confirmReview = async () => {
		if (!reviewing || !action) return
		try {
			if (action === "approve") {
				await approveMutation.mutateAsync(reviewing.id)
				toast({ title: "Request approved. Product has been deleted." })
			} else {
				await rejectMutation.mutateAsync(reviewing.id)
				toast({ title: "Request rejected." })
			}
			setReviewing(null)
			setAction(null)
		} catch (e) {
			toast({
				title: "Failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Deletion Requests
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Staff have requested to delete these products. Approve to delete the product, or
						reject to keep it.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
					{isLoading && (
						<p className="text-muted-foreground text-sm">Loading deletion requests...</p>
					)}
					{isError && (
						<p className="text-destructive text-sm">Failed to load deletion requests.</p>
					)}

					{!isLoading && !isError && (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Pharmacy</TableHead>
										<TableHead>Requested by</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{requests.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-muted-foreground h-24 text-center"
											>
												No pending deletion requests.
											</TableCell>
										</TableRow>
									) : (
										requests.map(req => (
											<TableRow key={req.id}>
												<TableCell className="font-medium">
													{productMap.get(req.productId) ?? req.productId}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{pharmacyMap.get(req.pharmacyId) ?? req.pharmacyId}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{userMap.get(req.requestedBy) ?? req.requestedBy}
												</TableCell>
												<TableCell className="text-muted-foreground max-w-[200px] truncate">
													{req.reason || "—"}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{req.createdAt
														? new Date(req.createdAt).toLocaleDateString()
														: "—"}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleReject(req)}
															disabled={
																rejectMutation.isPending || approveMutation.isPending
															}
														>
															Reject
														</Button>
														<Button
															size="sm"
															variant="destructive"
															onClick={() => handleApprove(req)}
															disabled={
																rejectMutation.isPending || approveMutation.isPending
															}
														>
															Approve
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<AlertDialog
				open={!!reviewing && action !== null}
				onOpenChange={open => {
					if (!open) {
						setReviewing(null)
						setAction(null)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{action === "approve" ? "Approve deletion?" : "Reject request?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{reviewing && (
								<>
									{action === "approve" ? (
										<>
											This will permanently delete the product &quot;
											{productMap.get(reviewing.productId) ?? reviewing.productId}
											&quot; and its inventory. This action cannot be undone.
										</>
									) : (
										<>
											The product &quot;
											{productMap.get(reviewing.productId) ?? reviewing.productId}
											&quot; will not be deleted. The staff member can submit a new
											request if needed.
										</>
									)}
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmReview}
							className={
								action === "approve"
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: undefined
							}
						>
							{action === "approve" ? "Approve & delete" : "Reject"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	)
}
