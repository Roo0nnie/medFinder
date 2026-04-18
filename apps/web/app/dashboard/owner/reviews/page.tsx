"use client"

import { useState } from "react"

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
import { Card, CardContent } from "@/core/components/ui/card"
import { ReviewsTable } from "@/features/reviews/components/reviews-table"
import { usePharmacyReviewDeleteMutation } from "@/features/reviews/api/reviews.hooks"

import { useToast } from "../../../../core/components/ui/use-toast"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerReviewsPage() {
	const { toast } = useToast()
	const deleteMutation = usePharmacyReviewDeleteMutation()
	const [idsToDelete, setIdsToDelete] = useState<string[] | null>(null)
	const [selectionClearKey, setSelectionClearKey] = useState(0)

	const handleDelete = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id)
			toast({ title: "Review deleted" })
			setSelectionClearKey(k => k + 1)
		} catch (e: any) {
			toast({ title: "Delete failed", description: e.message, variant: "destructive" })
		}
	}

	const handleDeleteMany = (ids: string[]) => {
		if (ids.length === 0) return
		setIdsToDelete(ids)
	}

	const confirmDeleteMany = async () => {
		if (!idsToDelete?.length) return
		try {
			await Promise.all(idsToDelete.map(id => deleteMutation.mutateAsync(id)))
			toast({ title: "Reviews deleted" })
			setIdsToDelete(null)
			setSelectionClearKey(k => k + 1)
		} catch (e: any) {
			toast({ title: "Delete failed", description: e.message, variant: "destructive" })
		}
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-foreground text-3xl font-bold tracking-tight">Reviews</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						View and moderate reviews for your pharmacies.
					</p>
				</div>

				<Card>
					<CardContent className="space-y-3 p-4 sm:p-6">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h2 className="text-lg font-semibold">Pharmacy reviews</h2>
						</div>

						<ReviewsTable
							onDelete={id => void handleDelete(id)}
							onDeleteMany={handleDeleteMany}
							selectionClearKey={selectionClearKey}
						/>
					</CardContent>
				</Card>
			</div>

			<AlertDialog open={!!idsToDelete?.length} onOpenChange={open => !open && setIdsToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {idsToDelete?.length ?? 0} reviews?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. Selected reviews will be permanently removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => void confirmDeleteMany()}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete all
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	)
}
