"use client"

import { Card, CardContent } from "@/core/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminAuditsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						View platform-wide audit events: user actions, admin changes, and system activity.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Time</TableHead>
										<TableHead>Actor</TableHead>
										<TableHead>Action</TableHead>
										<TableHead>Resource</TableHead>
										<TableHead>Details</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
											No audit entries yet. Audit logs will appear here when the feature is connected.
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
