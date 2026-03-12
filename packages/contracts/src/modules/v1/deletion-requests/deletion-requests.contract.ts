import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	DeletionRequestSchema,
	CreateDeletionRequestSchema,
	DeletionRequestSearchSchema,
	DeletionRequestIdSchema,
} from "./deletion-requests.schema.js"

export const deletionRequestsContract = {
	/**
	 * List deletion requests
	 * GET /deletion-requests
	 */
	list: oc
		.route({
			method: "GET",
			path: "/deletion-requests",
			summary: "List deletion requests",
			description: "Retrieve deletion requests with optional filters",
			tags: ["Deletion Requests"],
		})
		.input(DeletionRequestSearchSchema.partial())
		.output(z.array(DeletionRequestSchema)),

	/**
	 * Create a new deletion request
	 * POST /deletion-requests
	 */
	create: oc
		.route({
			method: "POST",
			path: "/deletion-requests",
			summary: "Create deletion request",
			description: "Create a new product deletion request",
			tags: ["Deletion Requests"],
		})
		.input(CreateDeletionRequestSchema)
		.output(DeletionRequestSchema),

	/**
	 * Approve a deletion request
	 * POST /deletion-requests/{id}/approve
	 */
	approve: oc
		.route({
			method: "POST",
			path: "/deletion-requests/{id}/approve",
			summary: "Approve deletion request",
			description: "Approve a pending deletion request",
			tags: ["Deletion Requests"],
		})
		.input(DeletionRequestIdSchema)
		.output(DeletionRequestSchema),

	/**
	 * Reject a deletion request
	 * POST /deletion-requests/{id}/reject
	 */
	reject: oc
		.route({
			method: "POST",
			path: "/deletion-requests/{id}/reject",
			summary: "Reject deletion request",
			description: "Reject a pending deletion request",
			tags: ["Deletion Requests"],
		})
		.input(DeletionRequestIdSchema.extend({ reason: z.string().optional() }))
		.output(DeletionRequestSchema),
}

