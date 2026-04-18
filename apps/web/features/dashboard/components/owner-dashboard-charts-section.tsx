"use client"

import type { ReviewRatingPoint, TopProduct } from "@repo/contracts"

import { ReviewRatingsLineChart, TopProductsChart } from "./DashboardCharts"

export function OwnerDashboardChartsSection({
	topStaffByAudit,
	topCategories,
	topViews,
	reviewRatings,
	topStaffByAuditLoading,
	topCategoriesLoading,
	topViewsLoading,
	reviewRatingsLoading,
	topStaffByAuditError,
	topCategoriesError,
	topViewsError,
	reviewRatingsError,
}: {
	topStaffByAudit: TopProduct[] | undefined
	topCategories: TopProduct[] | undefined
	topViews: TopProduct[] | undefined
	reviewRatings: ReviewRatingPoint[] | undefined
	topStaffByAuditLoading: boolean
	topCategoriesLoading: boolean
	topViewsLoading: boolean
	reviewRatingsLoading: boolean
	topStaffByAuditError: Error | null
	topCategoriesError: Error | null
	topViewsError: Error | null
	reviewRatingsError: Error | null
}) {
	const err =
		topStaffByAuditError || topCategoriesError || topViewsError || reviewRatingsError
	if (
		err &&
		!topStaffByAuditLoading &&
		!topCategoriesLoading &&
		!topViewsLoading &&
		!reviewRatingsLoading
	) {
		return (
			<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
				{err.message}
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-2">
				{topStaffByAuditLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={topStaffByAudit ?? []}
						title="Top staff by activity"
						subtitle="Staff on your roster with the most audit log actions (staff events only). Add more audited actions to see rankings."
					/>
				)}
				{topCategoriesLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={topCategories ?? []}
						title="Products by category"
						subtitle="Number of products in each category (your pharmacies)."
					/>
				)}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				{topViewsLoading ? (
					<div className="bg-muted/40 h-[300px] animate-pulse rounded-xl border" />
				) : (
					<TopProductsChart
						data={topViews ?? []}
						title="Product views"
						subtitle="Counted when customers open a product from your pharmacy page or browse the full product page."
					/>
				)}
				{reviewRatingsLoading ? (
					<div className="bg-muted/40 h-[350px] animate-pulse rounded-xl border" />
				) : (
					<ReviewRatingsLineChart
						data={reviewRatings ?? []}
						title="Reviews by star rating"
						subtitle="Pharmacy and product reviews combined (count per star, 1–5)."
					/>
				)}
			</div>
		</div>
	)
}
