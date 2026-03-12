import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	PlatformStatsSchema,
	OwnerStatsSchema,
	StaffStatsSchema,
	MonthlySalesPointSchema,
	TopProductSchema,
	OwnerStatsParamsSchema,
	StaffStatsParamsSchema,
	MonthlySalesParamsSchema,
	TopProductsParamsSchema,
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
}

