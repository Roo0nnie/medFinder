import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminAnalyticsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Reports &amp; Analytics</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for platform-wide reporting and analytics.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

