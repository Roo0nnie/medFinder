import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	UserSchema,
	UpdateUserSchema,
	UserIdSchema,
} from "./users.schema.js"

export const usersContract = {
	/**
	 * List all users
	 * GET /users
	 */
	list: oc
		.route({
			method: "GET",
			path: "/users",
			summary: "List users",
			description: "Retrieve all users",
			tags: ["Users"],
		})
		.output(z.array(UserSchema)),

	/**
	 * Get a single user by ID
	 * GET /users/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/users/{id}",
			summary: "Get user by ID",
			description: "Retrieve a single user by their ID",
			tags: ["Users"],
		})
		.input(UserIdSchema)
		.output(UserSchema),

	/**
	 * Update an existing user
	 * PUT /users/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/users/{id}",
			summary: "Update user",
			description: "Update an existing user (admin/owner or self)",
			tags: ["Users"],
		})
		.input(
			UserIdSchema.extend(UpdateUserSchema.shape)
		)
		.output(UserSchema),

	/**
	 * Delete a user by ID
	 * DELETE /users/{id}
	 */
	delete: oc
		.route({
			method: "DELETE",
			path: "/users/{id}",
			summary: "Delete user",
			description: "Delete a user by their ID (admin/owner only)",
			tags: ["Users"],
		})
		.input(UserIdSchema)
		.output(z.object({ success: z.boolean(), id: z.string() })),
}
