"use client"

import {
	useOwnerReviewRatingsQuery,
	useOwnerStatsQuery,
	useOwnerTopCategoriesQuery,
	useOwnerTopProductsByViewsQuery,
	useOwnerTopStaffByAuditActionsQuery,
} from "../api/analytics.hooks"
import { OwnerDashboardChartsSection } from "../components/owner-dashboard-charts-section"
import { OwnerDashboardQuickLinks } from "../components/owner-dashboard-quick-links"
import { OwnerDashboardStatGrid } from "../components/owner-dashboard-stat-grid"

export default function OwnerDashboard() {
	const ownerStats = useOwnerStatsQuery()
	const topStaffByAudit = useOwnerTopStaffByAuditActionsQuery(10)
	const topCategories = useOwnerTopCategoriesQuery(8)
	const topViews = useOwnerTopProductsByViewsQuery(8)
	const reviewRatings = useOwnerReviewRatingsQuery()

	return (
		<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Owner dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Staff activity, stock health, catalog mix, and how customers engage with your products.
				</p>
			</div>

			<OwnerDashboardStatGrid
				stats={ownerStats.data}
				isLoading={ownerStats.isLoading}
				error={ownerStats.error}
			/>

			<OwnerDashboardChartsSection
				topStaffByAudit={topStaffByAudit.data}
				topCategories={topCategories.data}
				topViews={topViews.data}
				reviewRatings={reviewRatings.data}
				topStaffByAuditLoading={topStaffByAudit.isLoading}
				topCategoriesLoading={topCategories.isLoading}
				topViewsLoading={topViews.isLoading}
				reviewRatingsLoading={reviewRatings.isLoading}
				topStaffByAuditError={topStaffByAudit.error}
				topCategoriesError={topCategories.error}
				topViewsError={topViews.error}
				reviewRatingsError={reviewRatings.error}
			/>

			<OwnerDashboardQuickLinks />
		</div>
	)
}
