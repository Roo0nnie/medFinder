import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const DeletionRequestStatusSchema = z.enum(["pending", "approved", "rejected"])

export const DeletionRequestSchema = z.object({
	id: z.string(),
	productId: z.string(),
	pharmacyId: z.string(),
	requestedBy: z.string(),
	reviewedBy: z.string().nullable().optional(),
	status: DeletionRequestStatusSchema.default("pending"),
	reason: z.string().nullable().optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const CreateDeletionRequestSchema = z.object({
	productId: z.string().min(1),
	pharmacyId: z.string().min(1),
	reason: z.string().optional(),
})

export const DeletionRequestSearchSchema = z.object({
	pharmacyId: z.string().optional(),
	status: DeletionRequestStatusSchema.optional(),
})

export const DeletionRequestIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type DeletionRequestStatus = z.infer<typeof DeletionRequestStatusSchema>
export type DeletionRequest = z.infer<typeof DeletionRequestSchema>
export type CreateDeletionRequestInput = z.infer<typeof CreateDeletionRequestSchema>
export type DeletionRequestSearch = z.infer<typeof DeletionRequestSearchSchema>
export type DeletionRequestIdInput = z.infer<typeof DeletionRequestIdSchema>

