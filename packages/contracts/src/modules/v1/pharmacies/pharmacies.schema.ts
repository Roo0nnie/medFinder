import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

const basePharmacySchema = z.object({
	id: z.string(),
	ownerId: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	address: z.string(),
	city: z.string(),
	state: z.string(),
	zipCode: z.string(),
	country: z.string().default("US"),
	logo: z.string().nullable().optional(),
	ownerImage: z.string().nullable().optional(),
	googleMapEmbed: z.string().nullable().optional(),
	socialLinks: z.string().nullable().optional(),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	phone: z.string().nullable().optional(),
	email: z.string().email().nullable().optional(),
	website: z.string().nullable().optional(),
	operatingHours: z.string().nullable().optional(), // JSON string
	isActive: z.boolean().default(true),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const PharmacySchema = basePharmacySchema

export const CreatePharmacySchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	address: z.string().min(1),
	city: z.string().min(1),
	state: z.string().min(1),
	zipCode: z.string().min(1),
	country: z.string().default("US"),
	logo: z.string().optional(),
	ownerImage: z.string().optional(),
	googleMapEmbed: z.string().optional(),
	socialLinks: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
	website: z.string().optional(),
	operatingHours: z.string().optional(),
})

export const UpdatePharmacySchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	zipCode: z.string().optional(),
	country: z.string().optional(),
	logo: z.string().optional(),
	ownerImage: z.string().optional(),
	googleMapEmbed: z.string().optional(),
	socialLinks: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
	website: z.string().optional(),
	operatingHours: z.string().optional(),
	isActive: z.boolean().optional(),
})

export const PharmacyListResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	city: z.string(),
	state: z.string(),
	phone: z.string().nullable().optional(),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	isActive: z.boolean(),
	distance: z.number().optional(), // From user location if provided
})

export const PharmacySearchSchema = z.object({
	query: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	radiusKm: z.number().default(10).optional(),
	isActive: z.boolean().default(true).optional(),
})

export const PharmacyIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type Pharmacy = z.infer<typeof PharmacySchema>
export type CreatePharmacyInput = z.infer<typeof CreatePharmacySchema>
export type UpdatePharmacyInput = z.infer<typeof UpdatePharmacySchema>
export type PharmacyListResponse = z.infer<typeof PharmacyListResponseSchema>
export type PharmacySearch = z.infer<typeof PharmacySearchSchema>
export type PharmacyIdInput = z.infer<typeof PharmacyIdSchema>
