import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminPharmaciesPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Pharmacy Management</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for managing pharmacy profiles and settings.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

