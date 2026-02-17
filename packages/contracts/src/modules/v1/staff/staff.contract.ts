import { oc } from "@orpc/contract"
import { z } from "zod"

import { staffSchema, staffCreateSchema, staffUpdateSchema, staffListResponseSchema } from "./staff.schema.js"

export const staffContract = {
	/**
	 * List all staff with search and pagination
	 * GET /staff
	 */
	list: oc
		.route({
			method: "GET",
			path: "/staff",
			summary: "List staff",
			description: "Retrieve staff members with optional search and pagination",
			tags: ["Staff"],
		})
		.input(
			z.object({
				search: z.string().optional().describe("Search query"),
				limit: z.coerce.number().int().positive().optional().describe("Limit results"),
				offset: z.coerce.number().int().nonnegative().optional().describe("Offset for pagination"),
				is_active: z.enum(["true", "false"]).optional().describe("Filter by active status"),
			})
		)
		.output(staffListResponseSchema),

	/**
	 * Create a new staff profile
	 * POST /staff/create
	 */
	create: oc
		.route({
			method: "POST",
			path: "/staff/create",
			summary: "Create staff",
			description: "Create a new staff profile (admin/owner only)",
			tags: ["Staff"],
		})
		.input(staffCreateSchema)
		.output(staffSchema),

	/**
	 * Get a single staff profile by ID
	 * GET /staff/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/staff/{id}",
			summary: "Get staff by ID",
			description: "Retrieve a single staff profile by its ID",
			tags: ["Staff"],
		})
		.input(z.object({ id: z.string() }))
		.output(staffSchema),

	/**
	 * Update an existing staff profile
	 * PUT /staff/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/staff/{id}",
			summary: "Update staff",
			description: "Update an existing staff profile (admin/owner only)",
			tags: ["Staff"],
		})
		.input(
			z.object({ id: z.string() }).extend(staffUpdateSchema.shape)
		)
		.output(staffSchema),

	/**
	 * Delete a staff profile by ID
	 * DELETE /staff/{id}
	 */
	delete: oc
		.route({
			method: "DELETE",
			path: "/staff/{id}",
			summary: "Delete staff",
			description: "Delete a staff profile (admin/owner only)",
			tags: ["Staff"],
		})
		.input(z.object({ id: z.string() }))
		.output(z.object({ success: z.boolean(), id: z.string() })),
}
