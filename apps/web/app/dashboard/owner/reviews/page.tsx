"use client"

import { Card, CardContent } from "@/core/components/ui/card"
import { ReviewsTable } from "@/features/reviews/components/reviews-table"
import { usePharmacyReviewDeleteMutation } from "@/features/reviews/api/reviews.hooks"

import { useToast } from "../../../../core/components/ui/use-toast"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerReviewsPage() {
	const { toast } = useToast()
	const deleteMutation = usePharmacyReviewDeleteMutation()

	const handleDelete = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id)
			toast({ title: "Review deleted" })
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

						<ReviewsTable onDelete={id => handleDelete(id)} />
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
