"use client"

import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"

export default function AdminPharmaciesLayout({ children }: { children: React.ReactNode }) {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Pharmacy Management</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Review owner business certificates before enabling customer visibility.
					</p>
				</div>

				{children}
			</div>
		</DashboardLayout>
	)
}

