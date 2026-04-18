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
import { useToast } from "@/core/components/ui/use-toast"
import {
	useDeletionRequestApproveMutation,
	useDeletionRequestRejectMutation,
	type DeletionRequest,
} from "@/features/deletion-requests/api/deletion-requests.hooks"
import { DeletionRequestsTable } from "@/features/deletion-requests/components/deletion-requests-table"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import { useProductsQuery } from "@/features/products/api/products.hooks"
import { useUsersQuery } from "@/features/users/api/users.hooks"

import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"
import { Card, CardContent } from "@/core/components/ui/card"

export default function OwnerDeletionRequestsPage() {
	const { toast } = useToast()
	const { data: products = [] } = useProductsQuery()
	useMyPharmaciesQuery()
	useUsersQuery()

	const approveMutation = useDeletionRequestApproveMutation()
	const rejectMutation = useDeletionRequestRejectMutation()

	const [reviewing, setReviewing] = useState<DeletionRequest | null>(null)
	const [action, setAction] = useState<"approve" | "reject" | null>(null)
	const [rejectingMany, setRejectingMany] = useState<DeletionRequest[] | null>(null)
	const [selectionClearKey, setSelectionClearKey] = useState(0)

	const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products])

	const handleApprove = (req: DeletionRequest) => {
		setReviewing(req)
		setAction("approve")
	}

	const handleReject = (req: DeletionRequest) => {
		setReviewing(req)
		setAction("reject")
	}

	const handleRejectMany = (reqs: DeletionRequest[]) => {
		if (reqs.length === 0) return
		setRejectingMany(reqs)
	}

	const confirmRejectMany = async () => {
		if (!rejectingMany?.length) return
		try {
			await Promise.all(rejectingMany.map(r => rejectMutation.mutateAsync(r.id)))
			toast({ title: "Requests rejected." })
			setRejectingMany(null)
			setSelectionClearKey(k => k + 1)
		} catch (e) {
			toast({
				title: "Failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
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
			setSelectionClearKey(k => k + 1)
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

				<Card>
					<CardContent className="space-y-3 p-4 sm:p-6">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h2 className="text-lg font-semibold">Deletion Requests</h2>
						</div>

						<DeletionRequestsTable
						onReject={req => handleReject(req)}
						onApprove={req => handleApprove(req)}
						onRejectMany={handleRejectMany}
						selectionClearKey={selectionClearKey}
					/>
					</CardContent>
				</Card>
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

			<AlertDialog
				open={!!rejectingMany?.length}
				onOpenChange={open => !open && setRejectingMany(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject {rejectingMany?.length ?? 0} requests?</AlertDialogTitle>
						<AlertDialogDescription>
							These deletion requests will be dismissed and the products will not be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => void confirmRejectMany()}>
							Reject all
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	)
}
