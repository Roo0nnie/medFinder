import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const PharmacyReviewSchema = z.object({
	id: z.string(),
	pharmacyId: z.string(),
	userId: z.string(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable().optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const ProductReviewSchema = z.object({
	id: z.string(),
	productId: z.string(),
	userId: z.string(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable().optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const CreatePharmacyReviewSchema = z.object({
	pharmacyId: z.string().min(1),
	rating: z.number().int().min(1).max(5),
	comment: z.string().optional(),
})

export const CreateProductReviewSchema = z.object({
	productId: z.string().min(1),
	rating: z.number().int().min(1).max(5),
	comment: z.string().optional(),
})

export const PharmacyReviewSearchSchema = z.object({
	pharmacyId: z.string().optional(),
	userId: z.string().optional(),
})

export const ProductReviewSearchSchema = z.object({
	productId: z.string().optional(),
	userId: z.string().optional(),
})

export const ReviewIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type PharmacyReview = z.infer<typeof PharmacyReviewSchema>
export type ProductReview = z.infer<typeof ProductReviewSchema>
export type CreatePharmacyReviewInput = z.infer<typeof CreatePharmacyReviewSchema>
export type CreateProductReviewInput = z.infer<typeof CreateProductReviewSchema>
export type PharmacyReviewSearch = z.infer<typeof PharmacyReviewSearchSchema>
export type ProductReviewSearch = z.infer<typeof ProductReviewSearchSchema>
export type ReviewIdInput = z.infer<typeof ReviewIdSchema>

