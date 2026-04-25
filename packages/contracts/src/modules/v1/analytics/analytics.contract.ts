import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	PlatformStatsSchema,
	OwnerStatsSchema,
	StaffStatsSchema,
	StaffDashboardResponseSchema,
	MonthlySalesPointSchema,
	TopProductSchema,
	ReviewRatingPointSchema,
	SearchTrendPointSchema,
	PeakHourPointSchema,
	OwnerSearchTrendsParamsSchema,
	OwnerStatsParamsSchema,
	StaffStatsParamsSchema,
	MonthlySalesParamsSchema,
	TopProductsParamsSchema,
	OwnerTopSearchesResponseSchema,
	OwnerTopSearchesParamsSchema,
	ProductEngagementCreateSchema,
	ProductSearchSelectionCreateSchema,
	AuditEventsResponseSchema,
} from "./analytics.schema.js"

export const analyticsContract = {
	/**
	 * Get platform-wide analytics stats
	 * GET /analytics/platform-stats
	 */
	platformStats: oc
		.route({
			method: "GET",
			path: "/analytics/platform-stats",
			summary: "Platform stats",
			description: "Retrieve high-level platform analytics stats",
			tags: ["Analytics"],
		})
		.output(PlatformStatsSchema),

	/**
	 * Get owner-scoped analytics stats
	 * GET /analytics/owner-stats
	 */
	ownerStats: oc
		.route({
			method: "GET",
			path: "/analytics/owner-stats",
			summary: "Owner stats",
			description: "Retrieve analytics stats scoped to a specific owner",
			tags: ["Analytics"],
		})
		.input(OwnerStatsParamsSchema.partial())
		.output(OwnerStatsSchema),

	/**
	 * Get staff-scoped analytics stats
	 * GET /analytics/staff-stats
	 */
	staffStats: oc
		.route({
			method: "GET",
			path: "/analytics/staff-stats",
			summary: "Staff stats",
			description: "Retrieve analytics stats scoped to a staff user",
			tags: ["Analytics"],
		})
		.input(StaffStatsParamsSchema.partial())
		.output(StaffStatsSchema),

	/**
	 * Get staff dashboard summary
	 * GET /analytics/staff-dashboard
	 */
	staffDashboard: oc
		.route({
			method: "GET",
			path: "/analytics/staff-dashboard",
			summary: "Staff dashboard",
			description: "Retrieve owner-scoped inventory dashboard data for the authenticated staff user",
			tags: ["Analytics"],
		})
		.output(StaffDashboardResponseSchema),

	/**
	 * Review counts per star (1–5), pharmacy + product reviews for owner scope
	 * GET /analytics/owner-review-ratings
	 */
	ownerReviewRatings: oc
		.route({
			method: "GET",
			path: "/analytics/owner-review-ratings",
			summary: "Owner review ratings distribution",
			tags: ["Analytics"],
		})
		.input(MonthlySalesParamsSchema.partial())
		.output(z.array(ReviewRatingPointSchema)),

	/**
	 * Get monthly sales data
	 * GET /analytics/monthly-sales
	 */
	monthlySales: oc
		.route({
			method: "GET",
			path: "/analytics/monthly-sales",
			summary: "Monthly sales",
			description: "Retrieve monthly sales data for charting",
			tags: ["Analytics"],
		})
		.input(MonthlySalesParamsSchema.partial())
		.output(z.array(MonthlySalesPointSchema)),

	/**
	 * Get top products data
	 * GET /analytics/top-products
	 */
	topProducts: oc
		.route({
			method: "GET",
			path: "/analytics/top-products",
			summary: "Top products",
			description: "Retrieve top products data for charting",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),

	/**
	 * Product counts by category for owner catalog
	 * GET /analytics/owner-top-categories
	 */
	ownerTopCategories: oc
		.route({
			method: "GET",
			path: "/analytics/owner-top-categories",
			summary: "Owner top categories",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),

	/**
	 * Top search queries that surfaced the owner's catalog
	 * GET /analytics/owner-top-searches
	 */
	ownerTopSearches: oc
		.route({
			method: "GET",
			path: "/analytics/owner-top-searches",
			summary: "Owner top searches",
			description: "Aggregated search queries where results included the owner's pharmacies",
			tags: ["Analytics"],
		})
		.input(OwnerTopSearchesParamsSchema.partial())
		.output(OwnerTopSearchesResponseSchema),

	/**
	 * Search volume over time (owner-attributed)
	 * GET /analytics/owner-search-trends
	 */
	ownerSearchTrends: oc
		.route({
			method: "GET",
			path: "/analytics/owner-search-trends",
			summary: "Owner search trends",
			tags: ["Analytics"],
		})
		.input(OwnerSearchTrendsParamsSchema.partial())
		.output(z.array(SearchTrendPointSchema)),

	/**
	 * Search counts by hour of day (owner-attributed)
	 * GET /analytics/owner-search-peak-hours
	 */
	ownerSearchPeakHours: oc
		.route({
			method: "GET",
			path: "/analytics/owner-search-peak-hours",
			summary: "Owner search peak hours",
			tags: ["Analytics"],
		})
		.input(MonthlySalesParamsSchema.partial())
		.output(z.array(PeakHourPointSchema)),

	/**
	 * Top queries with zero results (platform-wide)
	 * GET /analytics/owner-no-result-searches
	 */
	ownerNoResultSearches: oc
		.route({
			method: "GET",
			path: "/analytics/owner-no-result-searches",
			summary: "No-result searches",
			tags: ["Analytics"],
		})
		.input(OwnerTopSearchesParamsSchema.partial())
		.output(OwnerTopSearchesResponseSchema),

	/**
	 * Top products by recorded detail-page views
	 * GET /analytics/owner-top-products-by-views
	 */
	ownerTopProductsByViews: oc
		.route({
			method: "GET",
			path: "/analytics/owner-top-products-by-views",
			summary: "Owner top products by views",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),

	/**
	 * Fewest-viewed products (with at least one view)
	 * GET /analytics/owner-bottom-products-by-views
	 */
	ownerBottomProductsByViews: oc
		.route({
			method: "GET",
			path: "/analytics/owner-bottom-products-by-views",
			summary: "Owner bottom products by views",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),

	/**
	 * Trending products by view delta (recent vs previous window)
	 * GET /analytics/owner-trending-products-by-views
	 */
	ownerTrendingProductsByViews: oc
		.route({
			method: "GET",
			path: "/analytics/owner-trending-products-by-views",
			summary: "Owner trending products by views",
			tags: ["Analytics"],
		})
		.input(
			TopProductsParamsSchema.extend({
				windowDays: z.number().int().positive().max(90).optional(),
			}).partial()
		)
		.output(z.array(TopProductSchema)),

	/**
	 * High recent views + out-of-stock inventory
	 * GET /analytics/owner-high-demand-out-of-stock
	 */
	ownerHighDemandOutOfStock: oc
		.route({
			method: "GET",
			path: "/analytics/owner-high-demand-out-of-stock",
			summary: "High demand out of stock",
			tags: ["Analytics"],
		})
		.input(
			TopProductsParamsSchema.extend({
				engagementDays: z.number().int().positive().max(365).optional(),
			}).partial()
		)
		.output(z.array(TopProductSchema)),

	/**
	 * Record a product page engagement event
	 * POST /analytics/product-engagement
	 */
	productEngagement: oc
		.route({
			method: "POST",
			path: "/analytics/product-engagement",
			summary: "Product engagement",
			tags: ["Analytics"],
		})
		.input(ProductEngagementCreateSchema)
		.output(z.object({ success: z.boolean() })),

	/**
	 * Owner audit events
	 * GET /analytics/audit-events
	 */
	auditEvents: oc
		.route({
			method: "GET",
			path: "/analytics/audit-events",
			summary: "Audit events",
			tags: ["Analytics"],
		})
		.input(OwnerStatsParamsSchema.extend({ limit: z.number().int().positive().max(500).optional() }).partial())
		.output(AuditEventsResponseSchema),

	/**
	 * Record product opened from search
	 * POST /analytics/product-search-selection
	 */
	productSearchSelection: oc
		.route({
			method: "POST",
			path: "/analytics/product-search-selection",
			summary: "Product search selection",
			tags: ["Analytics"],
		})
		.input(ProductSearchSelectionCreateSchema)
		.output(z.object({ success: z.boolean() })),

	/**
	 * Top products by search-result clicks
	 * GET /analytics/owner-top-products-by-search-selections
	 */
	ownerTopProductsBySearchSelections: oc
		.route({
			method: "GET",
			path: "/analytics/owner-top-products-by-search-selections",
			summary: "Owner top products from search",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),

	/**
	 * Top staff by audit actions (staff role only)
	 * GET /analytics/owner-top-staff-by-audit-actions
	 */
	ownerTopStaffByAuditActions: oc
		.route({
			method: "GET",
			path: "/analytics/owner-top-staff-by-audit-actions",
			summary: "Owner top staff by audit actions",
			tags: ["Analytics"],
		})
		.input(TopProductsParamsSchema.partial())
		.output(z.array(TopProductSchema)),
}

