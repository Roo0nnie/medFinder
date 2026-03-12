import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function StaffProductsPage() {
	return (
		<DashboardLayout role="staff">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for viewing and managing products in your assigned pharmacy.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

