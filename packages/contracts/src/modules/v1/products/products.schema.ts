import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

const baseCategorySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	parentCategoryId: z.string().nullable().optional(),
})

export const CategorySchema = baseCategorySchema

export const baseMedicalProductSchema = z.object({
	id: z.string(),
	name: z.string(),
	genericName: z.string().nullable().optional(),
	brandName: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	manufacturer: z.string().nullable().optional(),
	categoryId: z.string(),
	dosageForm: z.string().nullable().optional(),
	strength: z.string().nullable().optional(),
	unit: z.string(),
	requiresPrescription: z.boolean().default(false),
	imageUrl: z.string().nullable().optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const MedicalProductSchema = baseMedicalProductSchema

export const CreateProductSchema = z.object({
	name: z.string().min(1),
	genericName: z.string().optional(),
	brandName: z.string().optional(),
	description: z.string().optional(),
	manufacturer: z.string().optional(),
	categoryId: z.string().min(1),
	dosageForm: z.string().optional(),
	strength: z.string().optional(),
	unit: z.string().min(1),
	requiresPrescription: z.boolean().default(false),
	imageUrl: z.string().optional(),
})

export const UpdateProductSchema = z.object({
	name: z.string().optional(),
	genericName: z.string().optional(),
	brandName: z.string().optional(),
	description: z.string().optional(),
	manufacturer: z.string().optional(),
	categoryId: z.string().optional(),
	dosageForm: z.string().optional(),
	strength: z.string().optional(),
	unit: z.string().optional(),
	requiresPrescription: z.boolean().optional(),
	imageUrl: z.string().optional(),
})

export const ProductSearchSchema = z.object({
	query: z.string().optional(),
	categoryId: z.string().optional(),
	requiresPrescription: z.boolean().optional(),
	manufacturer: z.string().optional(),
	limit: z.number().int().min(0).max(100).optional(),
	offset: z.number().int().min(0).optional(),
	prefix: z.boolean().optional(),
	searchType: z.enum(["plain", "websearch"]).optional(),
})

export const ProductIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type Category = z.infer<typeof CategorySchema>
export type MedicalProduct = z.infer<typeof MedicalProductSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type ProductSearch = z.infer<typeof ProductSearchSchema>
export type ProductIdInput = z.infer<typeof ProductIdSchema>
