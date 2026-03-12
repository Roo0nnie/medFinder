import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminReviewsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Reviews &amp; Ratings</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for reviewing and moderating pharmacy and product feedback.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

