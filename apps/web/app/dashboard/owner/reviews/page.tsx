import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerReviewsPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Reviews</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for viewing and responding to reviews on your pharmacies and
						products.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

