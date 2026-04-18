"use client"

import { useState } from "react"
import type { SearchQueryCountItem } from "@repo/contracts"

import { Button } from "@/core/components/ui/button"

import {
	useMonthlyReservationTrendQuery,
	useOwnerBottomProductsByViewsQuery,
	useOwnerHighDemandOutOfStockQuery,
	useOwnerNoResultSearchesQuery,
	useOwnerSearchPeakHoursQuery,
	useOwnerSearchTrendsQuery,
	useOwnerStatsQuery,
	useOwnerTopCategoriesQuery,
	useOwnerTopProductsByViewsQuery,
	useOwnerTopSearchesQuery,
	useOwnerTopProductsBySearchSelectionsQuery,
	useOwnerTrendingProductsByViewsQuery,
} from "../api/analytics.hooks"
import {
	MonthlySalesChart,
	PeakHoursBarChart,
	SearchTrendsLineChart,
	TopProductsChart,
} from "./DashboardCharts"

export function OwnerAnalyticsPage() {
	const [granularity, setGranularity] = useState<"daily" | "weekly">("daily")
	const ownerStats = useOwnerStatsQuery()
	const monthly = useMonthlyReservationTrendQuery()
	const topCategories = useOwnerTopCategoriesQuery(12)
	const topViews = useOwnerTopProductsByViewsQuery(12)
	const topSearches = useOwnerTopSearchesQuery(25)
	const searchTrends = useOwnerSearchTrendsQuery(granularity)
	const peakHours = useOwnerSearchPeakHoursQuery()
	const noResults = useOwnerNoResultSearchesQuery(20)
	const bottomViews = useOwnerBottomProductsByViewsQuery(10)
	const trending = useOwnerTrendingProductsByViewsQuery(10, 7)
	const highDemandOos = useOwnerHighDemandOutOfStockQuery(10, 30)
	const searchSelections = useOwnerTopProductsBySearchSelectionsQuery(12)

	const sectionErr =
		monthly.error ||
		topCategories.error ||
		topViews.error ||
		topSearches.error ||
		searchTrends.error ||
		peakHours.error ||
		noResults.error ||
		bottomViews.error ||
		trending.error ||
		highDemandOos.error ||
		searchSelections.error

	if (
		sectionErr &&
		!monthly.isLoading &&
		!topCategories.isLoading &&
		!topViews.isLoading &&
		!topSearches.isLoading &&
		!searchTrends.isLoading &&
		!peakHours.isLoading &&
		!noResults.isLoading &&
		!bottomViews.isLoading &&
		!trending.isLoading &&
		!highDemandOos.isLoading &&
		!searchSelections.isLoading
	) {
		return (
			<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
				</div>
				<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
					{sectionErr.message}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
				<p className="text-muted-foreground mt-2 text-sm">
					Reservations, catalog mix, search demand, product views, and inventory risk signals. Search
					&quot;products&quot; charts use detail-page views; top search terms are query strings, not SKUs.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{topViews.isLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={topViews.data ?? []}
						title="Most viewed products"
						subtitle="Detail-page opens (catalog + full product page)."
					/>
				)}
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<div className="border-b border-border bg-muted/50 p-6">
						<h2 className="text-base font-medium text-foreground">Most searched terms</h2>
						<p className="text-muted-foreground mt-1 text-xs">
							Queries where your pharmacies appeared in results (not product-level attribution).
						</p>
					</div>
					<div className="max-h-[320px] overflow-auto p-0">
						{topSearches.isLoading ? (
							<div className="text-muted-foreground p-6 text-sm">Loading…</div>
						) : (topSearches.data?.items.length ?? 0) === 0 ? (
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
									{(topSearches.data?.items ?? []).map((row: SearchQueryCountItem, idx: number) => (
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

			<div className="grid gap-6">
				{searchSelections.isLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={searchSelections.data ?? []}
						title="Most searched products (from search)"
						subtitle="Product opens from global search when a pharmacy is known (telemetry)."
					/>
				)}
			</div>

			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-muted-foreground text-sm">Search trends</span>
					<Button
						type="button"
						variant={granularity === "daily" ? "default" : "outline"}
						size="sm"
						onClick={() => setGranularity("daily")}
					>
						Daily
					</Button>
					<Button
						type="button"
						variant={granularity === "weekly" ? "default" : "outline"}
						size="sm"
						onClick={() => setGranularity("weekly")}
					>
						Weekly
					</Button>
				</div>
				<div className="grid gap-6 lg:grid-cols-2">
					{searchTrends.isLoading ? (
						<div className="bg-muted/40 h-[340px] animate-pulse rounded-xl border" />
					) : (
						<SearchTrendsLineChart
							data={searchTrends.data ?? []}
							title={granularity === "daily" ? "Search volume (daily)" : "Search volume (weekly)"}
							subtitle={
								granularity === "daily"
									? "Last 30 days · catalog-matched searches."
									: "Last 12 weeks · catalog-matched searches."
							}
						/>
					)}
					{peakHours.isLoading ? (
						<div className="bg-muted/40 h-[360px] animate-pulse rounded-xl border" />
					) : (
						<PeakHoursBarChart
							data={peakHours.data ?? []}
							title="Peak search hours"
							subtitle="Hour of day for catalog-matched searches."
						/>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<div className="border-b border-border bg-muted/50 p-6">
						<h2 className="text-base font-medium text-foreground">No-result searches</h2>
						<p className="text-muted-foreground mt-1 text-xs">
							Platform-wide queries that returned zero products. Owner cannot be inferred when count is
							zero.
						</p>
					</div>
					<div className="max-h-[320px] overflow-auto p-0">
						{noResults.isLoading ? (
							<div className="text-muted-foreground p-6 text-sm">Loading…</div>
						) : (noResults.data?.items.length ?? 0) === 0 ? (
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
									{(noResults.data?.items ?? []).map((row: SearchQueryCountItem, idx: number) => (
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
				{trending.isLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={trending.data ?? []}
						title="Trending products (views)"
						subtitle="Change in views: last 7 days vs previous 7 days (delta)."
					/>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{bottomViews.isLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={bottomViews.data ?? []}
						title="Low-demand products"
						subtitle="Fewest detail-page views among products with at least one view."
					/>
				)}
				{highDemandOos.isLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={highDemandOos.data ?? []}
						title="High demand, out of stock"
						subtitle="Recent views (30d) while at least one pharmacy row has quantity 0."
					/>
				)}
			</div>

			{ownerStats.data && (
				<p className="text-muted-foreground text-center text-xs">
					Snapshot: {ownerStats.data.productsAndVariantsCount} products & variants ·{" "}
					{ownerStats.data.categoriesCount} categories · {ownerStats.data.brandsCount} brands linked ·{" "}
					{ownerStats.data.staffActiveCount} active / {ownerStats.data.staffInactiveCount} inactive staff ·{" "}
					{ownerStats.data.inventoryInStockCount} in-stock SKUs · {ownerStats.data.inventoryLowStockCount}{" "}
					low-stock · {ownerStats.data.inventoryOutOfStockCount} out-of-stock ·{" "}
					{ownerStats.data.pendingDeletionRequestsCount} pending deletions.
				</p>
			)}
		</div>
	)
}
