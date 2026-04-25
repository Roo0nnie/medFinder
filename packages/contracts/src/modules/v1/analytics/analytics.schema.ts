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
	productsAndVariantsCount: z.number().int(),
	staffActiveCount: z.number().int(),
	staffInactiveCount: z.number().int(),
	inventoryInStockCount: z.number().int(),
	inventoryLowStockCount: z.number().int(),
	inventoryOutOfStockCount: z.number().int(),
	pendingDeletionRequestsCount: z.number().int(),
	categoriesCount: z.number().int(),
	brandsCount: z.number().int(),
})

export const StaffStatsSchema = z.object({
	activeReservations: z.number().int(),
	completedReservations: z.number().int(),
})

export const StaffDashboardStatsSchema = z.object({
	totalProductsManaged: z.number().int(),
	itemsOutOfStock: z.number().int(),
	lowStockAlerts: z.number().int(),
})

export const MonthlySalesPointSchema = z.object({
	name: z.string(),
	sales: z.number(),
})

export const StaffDashboardTrendPointSchema = z.object({
	day: z.string(),
	stock: z.number().int(),
})

export const StaffDashboardRecentUpdateSchema = z.object({
	id: z.string(),
	productName: z.string(),
	variantLabel: z.string().nullable().optional(),
	currentQuantity: z.number().int().nullable(),
	direction: z.enum(["increase", "decrease", "update"]),
	action: z.string(),
	updatedAt: z.string(),
})

export const StaffDashboardInventoryRowSchema = z.object({
	id: z.string(),
	productName: z.string(),
	variantLabel: z.string().nullable().optional(),
	sku: z.string(),
	stockLimit: z.number().int(),
	currentStock: z.number().int(),
	stockStatus: z.enum(["ok", "low", "out", "unavailable"]),
})

export const StaffDashboardResponseSchema = z.object({
	stats: StaffDashboardStatsSchema,
	trend: z.array(StaffDashboardTrendPointSchema),
	recentUpdates: z.array(StaffDashboardRecentUpdateSchema),
	inventoryList: z.array(StaffDashboardInventoryRowSchema),
})

export const TopProductSchema = z.object({
	name: z.string(),
	value: z.number(),
})

export const ReviewRatingPointSchema = z.object({
	name: z.string(),
	value: z.number(),
})

export const SearchTrendPointSchema = z.object({
	name: z.string(),
	count: z.number().int(),
})

export const PeakHourPointSchema = z.object({
	hour: z.number().int().min(0).max(23),
	count: z.number().int(),
})

export const OwnerSearchTrendsParamsSchema = z.object({
	ownerId: z.string().optional(),
	granularity: z.enum(["daily", "weekly"]).optional(),
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

export const SearchQueryCountItemSchema = z.object({
	query: z.string(),
	count: z.number().int(),
})

export const OwnerTopSearchesResponseSchema = z.object({
	items: z.array(SearchQueryCountItemSchema),
})

export const OwnerTopSearchesParamsSchema = z.object({
	ownerId: z.string().optional(),
	limit: z.number().int().positive().max(100).optional(),
})

export const ProductEngagementCreateSchema = z.object({
	productId: z.string().min(1),
	dwellSeconds: z.number().int().min(0).max(86400).optional(),
	sessionId: z.string().optional(),
})

export const ProductSearchSelectionCreateSchema = z.object({
	productId: z.string().min(1),
	pharmacyId: z.string().optional(),
	searchQuery: z.string().optional(),
})

export const AuditEventItemSchema = z.object({
	id: z.string(),
	createdAt: z.string(),
	actorRole: z.enum(["owner", "staff", "admin", "customer"]).nullable().optional(),
	actor: z.string(),
	action: z.string(),
	resource: z.string(),
	details: z.string(),
})

export const AuditEventsResponseSchema = z.object({
	items: z.array(AuditEventItemSchema),
})

// ============================================================================
// TYPES
// ============================================================================

export type PlatformStats = z.infer<typeof PlatformStatsSchema>
export type OwnerStats = z.infer<typeof OwnerStatsSchema>
export type StaffStats = z.infer<typeof StaffStatsSchema>
export type StaffDashboardStats = z.infer<typeof StaffDashboardStatsSchema>
export type MonthlySalesPoint = z.infer<typeof MonthlySalesPointSchema>
export type StaffDashboardTrendPoint = z.infer<typeof StaffDashboardTrendPointSchema>
export type StaffDashboardRecentUpdate = z.infer<typeof StaffDashboardRecentUpdateSchema>
export type StaffDashboardInventoryRow = z.infer<typeof StaffDashboardInventoryRowSchema>
export type StaffDashboardResponse = z.infer<typeof StaffDashboardResponseSchema>
export type TopProduct = z.infer<typeof TopProductSchema>
export type ReviewRatingPoint = z.infer<typeof ReviewRatingPointSchema>
export type SearchTrendPoint = z.infer<typeof SearchTrendPointSchema>
export type PeakHourPoint = z.infer<typeof PeakHourPointSchema>
export type OwnerSearchTrendsParams = z.infer<typeof OwnerSearchTrendsParamsSchema>
export type OwnerStatsParams = z.infer<typeof OwnerStatsParamsSchema>
export type StaffStatsParams = z.infer<typeof StaffStatsParamsSchema>
export type MonthlySalesParams = z.infer<typeof MonthlySalesParamsSchema>
export type TopProductsParams = z.infer<typeof TopProductsParamsSchema>
export type SearchQueryCountItem = z.infer<typeof SearchQueryCountItemSchema>
export type OwnerTopSearchesResponse = z.infer<typeof OwnerTopSearchesResponseSchema>
export type OwnerTopSearchesParams = z.infer<typeof OwnerTopSearchesParamsSchema>
export type ProductEngagementCreate = z.infer<typeof ProductEngagementCreateSchema>
export type ProductSearchSelectionCreate = z.infer<typeof ProductSearchSelectionCreateSchema>
export type AuditEventItem = z.infer<typeof AuditEventItemSchema>
export type AuditEventsResponse = z.infer<typeof AuditEventsResponseSchema>

