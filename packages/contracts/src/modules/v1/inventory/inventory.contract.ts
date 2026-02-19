import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	InventorySchema,
	CreateInventorySchema,
	UpdateInventorySchema,
	InventorySearchSchema,
	InventoryAvailabilitySchema,
	InventoryIdSchema,
} from "./inventory.schema.js"

export const inventoryContract = {
	/**
	 * List inventory records
	 * GET /inventory
	 */
	list: oc
		.route({
			method: "GET",
			path: "/inventory",
			summary: "List inventory",
			description: "Retrieve inventory records with optional filters",
			tags: ["Inventory"],
		})
		.input(InventorySearchSchema.partial())
		.output(z.array(InventorySchema)),

	/**
	 * Get a single inventory record by ID
	 * GET /inventory/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/inventory/{id}",
			summary: "Get inventory by ID",
			description: "Retrieve a single inventory record",
			tags: ["Inventory"],
		})
		.input(InventoryIdSchema)
		.output(InventorySchema),

	/**
	 * Create a new inventory record
	 * POST /inventory
	 */
	create: oc
		.route({
			method: "POST",
			path: "/inventory",
			summary: "Create inventory",
			description: "Add a product to pharmacy inventory (owner/staff only)",
			tags: ["Inventory"],
		})
		.input(CreateInventorySchema)
		.output(InventorySchema),

	/**
	 * Update an inventory record
	 * PUT /inventory/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/inventory/{id}",
			summary: "Update inventory",
			description: "Update an inventory record (owner/staff only)",
			tags: ["Inventory"],
		})
		.input(InventoryIdSchema.extend(UpdateInventorySchema.shape))
		.output(InventorySchema),

	/**
	 * Delete an inventory record
	 * DELETE /inventory/{id}
	 */
	delete: oc
		.route({
			method: "DELETE",
			path: "/inventory/{id}",
			summary: "Delete inventory",
			description: "Delete an inventory record (owner/staff only)",
			tags: ["Inventory"],
		})
		.input(InventoryIdSchema)
		.output(z.object({ success: z.boolean(), id: z.string() })),

	/**
	 * Check product availability
	 * POST /inventory/check-availability
	 */
	checkAvailability: oc
		.route({
			method: "POST",
			path: "/inventory/check-availability",
			summary: "Check availability",
			description: "Check if a product is available at a pharmacy",
			tags: ["Inventory"],
		})
		.input(InventoryAvailabilitySchema)
		.output(
			z.object({
				available: z.boolean(),
				quantity: z.number().int(),
				price: z.number().optional(),
				discountPrice: z.number().optional(),
			})
		),

	/**
	 * Get low stock items
	 * GET /inventory/low-stock
	 */
	lowStock: oc
		.route({
			method: "GET",
			path: "/inventory/low-stock",
			summary: "Get low stock items",
			description: "Get inventory items with low stock levels (owner/staff only)",
			tags: ["Inventory"],
		})
		.input(
			z.object({
				pharmacyId: z.string().optional(),
				threshold: z.number().int().default(10).optional(),
			})
		)
		.output(z.array(InventorySchema)),
}
