import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function StaffStockAlertsPage() {
	return (
		<DashboardLayout role="staff">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Stock Alerts</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for monitoring low stock and out-of-stock items.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

