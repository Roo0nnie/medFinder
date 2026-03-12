import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerAnalyticsPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for viewing performance and sales analytics for your pharmacies.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

