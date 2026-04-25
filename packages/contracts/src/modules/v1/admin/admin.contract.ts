import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	AdminAnalyticsResponseSchema,
	AdminAuditEventSchema,
	AdminCategoryRowSchema,
	AdminDashboardResponseSchema,
	AdminPharmacyRowSchema,
	AdminProductRowSchema,
	AdminReviewRowSchema,
	AdminUserRowSchema,
} from "./admin.schema.js"

export const adminContract = {
	users: oc
		.route({
			method: "GET",
			path: "/admin/users",
			summary: "Admin users list",
			tags: ["Admin"],
		})
		.input(z.object({ search: z.string().optional() }).partial())
		.output(z.array(AdminUserRowSchema)),

	pharmacies: oc
		.route({
			method: "GET",
			path: "/admin/pharmacies",
			summary: "Admin pharmacies list",
			tags: ["Admin"],
		})
		.input(z.object({ certificateStatus: z.enum(["pending", "approved", "rejected"]).optional(), search: z.string().optional() }).partial())
		.output(z.array(AdminPharmacyRowSchema)),

	products: oc
		.route({
			method: "GET",
			path: "/admin/products",
			summary: "Admin products list",
			tags: ["Admin"],
		})
		.input(z.object({ search: z.string().optional() }).partial())
		.output(z.array(AdminProductRowSchema)),

	categories: oc
		.route({
			method: "GET",
			path: "/admin/categories",
			summary: "Admin categories list",
			tags: ["Admin"],
		})
		.input(z.object({ ownerId: z.string().optional(), rx: z.boolean().optional(), search: z.string().optional() }).partial())
		.output(z.array(AdminCategoryRowSchema)),

	reviews: oc
		.route({
			method: "GET",
			path: "/admin/reviews",
			summary: "Admin reviews list",
			tags: ["Admin"],
		})
		.input(z.object({ pharmacyId: z.string().optional(), rating: z.number().int().min(1).max(5).optional(), search: z.string().optional() }).partial())
		.output(z.array(AdminReviewRowSchema)),

	audits: oc
		.route({
			method: "GET",
			path: "/admin/audits",
			summary: "Admin audits list",
			tags: ["Admin"],
		})
		.input(
			z
				.object({
					actorRole: z.enum(["owner", "staff", "admin", "customer"]).optional(),
					action: z.string().optional(),
					resourceType: z.string().optional(),
					ownerId: z.string().optional(),
					from: z.string().optional(),
					to: z.string().optional(),
					search: z.string().optional(),
					limit: z.number().int().positive().max(500).optional(),
				})
				.partial()
		)
		.output(z.array(AdminAuditEventSchema)),

	analyticsDashboard: oc
		.route({
			method: "GET",
			path: "/admin/analytics/dashboard",
			summary: "Admin analytics dashboard",
			tags: ["Admin", "Analytics"],
		})
		.input(z.object({ ownerId: z.string().optional() }).partial())
		.output(AdminDashboardResponseSchema),

	analyticsReports: oc
		.route({
			method: "GET",
			path: "/admin/analytics/reports",
			summary: "Admin analytics reports",
			tags: ["Admin", "Analytics"],
		})
		.input(z.object({ ownerId: z.string().optional() }).partial())
		.output(AdminAnalyticsResponseSchema),
}

