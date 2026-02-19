import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

const baseInventorySchema = z.object({
	id: z.string(),
	pharmacyId: z.string(),
	productId: z.string(),
	quantity: z.number().int().default(0),
	price: z.number(),
	discountPrice: z.number().nullable().optional(),
	expiryDate: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val))
		.nullable()
		.optional(),
	batchNumber: z.string().nullable().optional(),
	isAvailable: z.boolean().default(true),
	lastRestocked: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val))
		.nullable()
		.optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const InventorySchema = baseInventorySchema

export const CreateInventorySchema = z.object({
	productId: z.string().min(1),
	quantity: z.number().int().min(0),
	price: z.number().positive(),
	discountPrice: z.number().positive().optional(),
	expiryDate: z.string().optional(), // ISO date string
	batchNumber: z.string().optional(),
})

export const UpdateInventorySchema = z.object({
	quantity: z.number().int().min(0).optional(),
	price: z.number().positive().optional(),
	discountPrice: z.number().positive().optional(),
	expiryDate: z.string().optional(),
	batchNumber: z.string().optional(),
	isAvailable: z.boolean().optional(),
})

export const InventorySearchSchema = z.object({
	pharmacyId: z.string().optional(),
	productId: z.string().optional(),
	isAvailable: z.boolean().optional(),
})

export const InventoryAvailabilitySchema = z.object({
	productId: z.string(),
	pharmacyId: z.string().optional(),
	quantity: z.number().int().min(1).optional(),
})

export const InventoryIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type Inventory = z.infer<typeof InventorySchema>
export type CreateInventoryInput = z.infer<typeof CreateInventorySchema>
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>
export type InventorySearch = z.infer<typeof InventorySearchSchema>
export type InventoryAvailability = z.infer<typeof InventoryAvailabilitySchema>
export type InventoryIdInput = z.infer<typeof InventoryIdSchema>
