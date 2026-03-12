import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminProductsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Product Monitoring</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for monitoring and managing products across pharmacies.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

