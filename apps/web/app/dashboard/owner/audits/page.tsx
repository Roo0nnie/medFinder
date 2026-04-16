"use client"

import { Card, CardContent } from "@/core/components/ui/card"
import { AuditsTable } from "@/features/audits/components/audits-table"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerAuditsPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						View audit events for your pharmacies: staff actions, inventory changes, and settings updates.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<AuditsTable />
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
