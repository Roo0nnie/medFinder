import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const PlatformStatsSchema = z.object({
	totalPharmacies: z.number().int(),
	totalInventoryItems: z.number().int(),
	totalReservations: z.number().int(),
})

export const OwnerStatsSchema = z.object({
	pharmaciesCount: z.number().int(),
	inventoryItemsCount: z.number().int(),
	reservationsCount: z.number().int(),
})

export const StaffStatsSchema = z.object({
	activeReservations: z.number().int(),
	completedReservations: z.number().int(),
})

export const MonthlySalesPointSchema = z.object({
	name: z.string(),
	sales: z.number(),
})

export const TopProductSchema = z.object({
	name: z.string(),
	value: z.number(),
})

export const OwnerStatsParamsSchema = z.object({
	ownerId: z.string().optional(),
})

export const StaffStatsParamsSchema = z.object({
	userId: z.string().optional(),
})

export const MonthlySalesParamsSchema = z.object({
	ownerId: z.string().optional(),
})

export const TopProductsParamsSchema = z.object({
	ownerId: z.string().optional(),
	limit: z.number().int().positive().max(100).optional(),
})

// ============================================================================
// TYPES
// ============================================================================

export type PlatformStats = z.infer<typeof PlatformStatsSchema>
export type OwnerStats = z.infer<typeof OwnerStatsSchema>
export type StaffStats = z.infer<typeof StaffStatsSchema>
export type MonthlySalesPoint = z.infer<typeof MonthlySalesPointSchema>
export type TopProduct = z.infer<typeof TopProductSchema>
export type OwnerStatsParams = z.infer<typeof OwnerStatsParamsSchema>
export type StaffStatsParams = z.infer<typeof StaffStatsParamsSchema>
export type MonthlySalesParams = z.infer<typeof MonthlySalesParamsSchema>
export type TopProductsParams = z.infer<typeof TopProductsParamsSchema>

