import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerPharmaciesPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">My Pharmacies</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						This is a placeholder page for managing your pharmacy locations and details.
					</p>
				</div>
			</div>
		</DashboardLayout>
	)
}

