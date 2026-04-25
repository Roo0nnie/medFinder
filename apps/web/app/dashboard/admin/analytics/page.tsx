"use client"

import { MonthlySalesChart, TopProductsChart } from "@/features/dashboard/components/DashboardCharts"
import { StatCard } from "@/features/dashboard/components/StatCard"
import { Card, CardContent } from "@/core/components/ui/card"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { useAdminAnalyticsReportsQuery } from "@/features/admin/api/admin.hooks"
import { Activity, Store, Users } from "lucide-react"

export default function AdminAnalyticsPage() {
	const q = useAdminAnalyticsReportsQuery()
	const kpis = q.data?.kpis
	const topSearches = q.data?.topSearches?.items ?? []
	const noResultSearches = q.data?.noResultSearches?.items ?? []

	return (
		<DashboardLayout role="admin">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Reports &amp; Analytics</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Platform-wide analytics for all pharmacies and products (admin scope).
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<StatCard title="Users" value={kpis?.usersTotal ?? 0} icon={<Users className="h-4 w-4" />} />
					<StatCard title="Pharmacies" value={kpis?.pharmaciesTotal ?? 0} icon={<Store className="h-4 w-4" />} />
					<StatCard title="Products" value={kpis?.productsTotal ?? 0} icon={<Activity className="h-4 w-4" />} />
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<MonthlySalesChart data={q.data?.monthlyReservations ?? []} />
					<TopProductsChart data={q.data?.topProducts ?? []} />
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-xl border border-border bg-card shadow-sm">
						<div className="border-b border-border bg-muted/50 p-6">
							<h2 className="text-base font-medium text-foreground">Most searched terms</h2>
							<p className="text-muted-foreground mt-1 text-xs">Platform-wide product search queries.</p>
						</div>
						<div className="max-h-[320px] overflow-auto p-0">
							{q.isLoading ? (
								<div className="text-muted-foreground p-6 text-sm">Loading…</div>
							) : topSearches.length === 0 ? (
								<div className="text-muted-foreground p-6 text-sm">No search data yet.</div>
							) : (
								<table className="w-full text-left text-sm">
									<thead className="bg-muted/50 text-muted-foreground sticky top-0 text-xs uppercase">
										<tr>
											<th className="px-6 py-3">Query</th>
											<th className="px-6 py-3 text-right">Count</th>
										</tr>
									</thead>
									<tbody>
										{topSearches.map((row, idx) => (
											<tr key={`${row.query}-${idx}`} className="border-border hover:bg-muted/40 border-b">
												<td className="text-foreground px-6 py-3">{row.query}</td>
												<td className="text-muted-foreground px-6 py-3 text-right tabular-nums">
													{row.count}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card shadow-sm">
						<div className="border-b border-border bg-muted/50 p-6">
							<h2 className="text-base font-medium text-foreground">No-result searches</h2>
							<p className="text-muted-foreground mt-1 text-xs">
								Platform-wide queries that returned zero products.
							</p>
						</div>
						<div className="max-h-[320px] overflow-auto p-0">
							{q.isLoading ? (
								<div className="text-muted-foreground p-6 text-sm">Loading…</div>
							) : noResultSearches.length === 0 ? (
								<div className="text-muted-foreground p-6 text-sm">No zero-result searches logged.</div>
							) : (
								<table className="w-full text-left text-sm">
									<thead className="bg-muted/50 text-muted-foreground sticky top-0 text-xs uppercase">
										<tr>
											<th className="px-6 py-3">Query</th>
											<th className="px-6 py-3 text-right">Count</th>
										</tr>
									</thead>
									<tbody>
										{noResultSearches.map((row, idx) => (
											<tr key={`${row.query}-${idx}`} className="border-border hover:bg-muted/40 border-b">
												<td className="text-foreground px-6 py-3">{row.query}</td>
												<td className="text-muted-foreground px-6 py-3 text-right tabular-nums">
													{row.count}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
				</div>

				{q.isError ? (
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
								Failed to load admin analytics.
							</div>
						</CardContent>
					</Card>
				) : null}
			</div>
		</DashboardLayout>
	)
}

