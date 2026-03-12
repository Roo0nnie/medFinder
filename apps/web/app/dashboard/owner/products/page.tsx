import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerProductsPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Product Management</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for managing products in your pharmacies.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

