import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	PharmacySchema,
	CreatePharmacySchema,
	UpdatePharmacySchema,
	PharmacyListResponseSchema,
	PharmacySearchSchema,
	PharmacyIdSchema,
} from "./pharmacies.schema.js"

export const pharmaciesContract = {
	/**
	 * List all active pharmacies
	 * GET /pharmacies
	 */
	list: oc
		.route({
			method: "GET",
			path: "/pharmacies",
			summary: "List pharmacies",
			description: "Retrieve all active pharmacies with optional search/filter",
			tags: ["Pharmacies"],
		})
		.input(PharmacySearchSchema.partial())
		.output(z.array(PharmacyListResponseSchema)),

	/**
	 * Get a single pharmacy by ID
	 * GET /pharmacies/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/pharmacies/{id}",
			summary: "Get pharmacy by ID",
			description: "Retrieve a single pharmacy with all details",
			tags: ["Pharmacies"],
		})
		.input(PharmacyIdSchema)
		.output(PharmacySchema),

	/**
	 * Create a new pharmacy
	 * POST /pharmacies
	 */
	create: oc
		.route({
			method: "POST",
			path: "/pharmacies",
			summary: "Create pharmacy",
			description: "Create a new pharmacy (owner only)",
			tags: ["Pharmacies"],
		})
		.input(CreatePharmacySchema)
		.output(PharmacySchema),

	/**
	 * Update an existing pharmacy
	 * PUT /pharmacies/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/pharmacies/{id}",
			summary: "Update pharmacy",
			description: "Update an existing pharmacy (owner only)",
			tags: ["Pharmacies"],
		})
		.input(PharmacyIdSchema.extend(UpdatePharmacySchema.shape))
		.output(PharmacySchema),

	/**
	 * Delete a pharmacy by ID
	 * DELETE /pharmacies/{id}
	 */
	delete: oc
		.route({
			method: "DELETE",
			path: "/pharmacies/{id}",
			summary: "Delete pharmacy",
			description: "Delete a pharmacy (owner only, soft delete)",
			tags: ["Pharmacies"],
		})
		.input(PharmacyIdSchema)
		.output(z.object({ success: z.boolean(), id: z.string() })),

	/**
	 * Get user's pharmacies
	 * GET /pharmacies/my-pharmacies
	 */
	myPharmacies: oc
		.route({
			method: "GET",
			path: "/pharmacies/my-pharmacies",
			summary: "Get my pharmacies",
			description: "Retrieve all pharmacies owned by the authenticated user",
			tags: ["Pharmacies"],
		})
		.output(z.array(PharmacySchema)),

	/**
	 * Upload pharmacy business certificate
	 * POST /pharmacies/{id}/certificate
	 */
	uploadCertificate: oc
		.route({
			method: "POST",
			path: "/pharmacies/{id}/certificate",
			summary: "Upload pharmacy certificate",
			description: "Upload business certificate file metadata for pharmacy verification",
			tags: ["Pharmacies"],
		})
		.input(PharmacyIdSchema.extend({ certificateNumber: z.string().min(1) }))
		.output(PharmacySchema),

	/**
	 * Review pharmacy business certificate
	 * POST /pharmacies/{id}/certificate/review
	 */
	reviewCertificate: oc
		.route({
			method: "POST",
			path: "/pharmacies/{id}/certificate/review",
			summary: "Review pharmacy certificate",
			description: "Approve or reject a pharmacy business certificate (admin only)",
			tags: ["Pharmacies"],
		})
		.input(
			PharmacyIdSchema.extend({
				status: z.enum(["approved", "rejected"]),
				reviewNote: z.string().optional(),
			})
		)
		.output(PharmacySchema),
}
