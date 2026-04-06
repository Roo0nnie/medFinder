"use client"

import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"

export default function OwnerProductManagementLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-foreground text-3xl font-bold tracking-tight">Product Management</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Manage product details, inventory records, and product categories from one place.
					</p>
				</div>
				{children}
			</div>
		</DashboardLayout>
	)
}
