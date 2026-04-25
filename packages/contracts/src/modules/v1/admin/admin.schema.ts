import { z } from "zod"

export const AdminUserRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	phone: z.string().nullable().optional(),
	emailVerified: z.boolean(),
	ownedPharmaciesCount: z.number().int(),
	staffAssignmentsCount: z.number().int(),
	reservationsCount: z.number().int(),
	createdAt: z.string(),
	updatedAt: z.string(),
})

export const AdminPharmacyRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	ownerId: z.string(),
	ownerName: z.string(),
	ownerEmail: z.string().email().nullable().optional(),
	isActive: z.boolean(),
	certificateStatus: z.enum(["pending", "approved", "rejected"]),
	certificateNumber: z.string().nullable().optional(),
	certificateFileUrl: z.string().nullable().optional(),
	certificateSubmittedAt: z.string().nullable().optional(),
	certificateReviewedAt: z.string().nullable().optional(),
	certificateReviewedBy: z.string().nullable().optional(),
	certificateReviewNote: z.string().nullable().optional(),
	customerVisible: z.boolean(),
	productCount: z.number().int(),
	reviewCount: z.number().int(),
	updatedAt: z.string(),
})

export const AdminProductRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	pharmacyId: z.string().nullable().optional(),
	pharmacyName: z.string().nullable().optional(),
	ownerId: z.string().nullable().optional(),
	ownerName: z.string().nullable().optional(),
	categoryId: z.string(),
	categoryName: z.string().nullable().optional(),
	brandId: z.string().nullable().optional(),
	brandName: z.string().nullable().optional(),
	variantsCount: z.number().int(),
	inventoryTotal: z.number().int(),
	stockHealth: z.enum(["ok", "low", "out"]),
	requiresPrescription: z.boolean(),
	updatedAt: z.string(),
})

export const AdminCategoryRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	ownerId: z.string(),
	ownerName: z.string(),
	parentId: z.string().nullable().optional(),
	parentName: z.string().nullable().optional(),
	requiresPrescription: z.boolean(),
	productCount: z.number().int(),
	updatedAt: z.string(),
})

export const AdminReviewRowSchema = z.object({
	id: z.string(),
	reviewType: z.literal("pharmacy"),
	pharmacyId: z.string(),
	pharmacyName: z.string().nullable().optional(),
	userId: z.string(),
	userName: z.string(),
	userEmail: z.string().email().nullable().optional(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable().optional(),
	createdAt: z.string(),
})

export const AdminAuditEventSchema = z.object({
	id: z.string(),
	createdAt: z.string(),
	actorRole: z.enum(["owner", "staff", "admin", "customer"]).nullable().optional(),
	actorUserId: z.string().nullable().optional(),
	actor: z.string(),
	action: z.string(),
	resourceType: z.string(),
	resourceId: z.string().nullable().optional(),
	ownerId: z.string(),
	details: z.string(),
})

export const AdminDashboardResponseSchema = z.object({
	kpis: z.object({
		usersTotal: z.number().int(),
		pharmaciesTotal: z.number().int(),
		productsTotal: z.number().int(),
		reservationsTotal: z.number().int(),
	}),
	certificatePipeline: z.object({
		pending: z.number().int(),
		approved: z.number().int(),
		rejected: z.number().int(),
	}),
	monthlyReservations: z.array(z.object({ name: z.string(), sales: z.number() })),
	topProducts: z.array(z.object({ name: z.string(), value: z.number() })),
	topCategories: z.array(z.object({ name: z.string(), value: z.number() })),
	reviewDistribution: z.array(z.object({ name: z.string(), value: z.number() })),
	topSearches: z.object({ items: z.array(z.object({ query: z.string(), count: z.number().int() })) }),
	noResultSearches: z.object({ items: z.array(z.object({ query: z.string(), count: z.number().int() })) }),
	recentUsers: z.array(
		z.object({ id: z.string(), name: z.string(), email: z.string().email(), role: z.string(), createdAt: z.string() })
	),
	recentCertificateSubmissions: z.array(
		z.object({
			pharmacyId: z.string(),
			pharmacyName: z.string(),
			ownerId: z.string(),
			ownerName: z.string(),
			certificateStatus: z.enum(["pending", "approved", "rejected"]),
			submittedAt: z.string().nullable().optional(),
		})
	),
	recentAudits: z.object({ items: z.array(AdminAuditEventSchema) }),
})

export const AdminAnalyticsResponseSchema = AdminDashboardResponseSchema

export type AdminUserRow = z.infer<typeof AdminUserRowSchema>
export type AdminPharmacyRow = z.infer<typeof AdminPharmacyRowSchema>
export type AdminProductRow = z.infer<typeof AdminProductRowSchema>
export type AdminCategoryRow = z.infer<typeof AdminCategoryRowSchema>
export type AdminReviewRow = z.infer<typeof AdminReviewRowSchema>
export type AdminAuditEvent = z.infer<typeof AdminAuditEventSchema>
export type AdminDashboardResponse = z.infer<typeof AdminDashboardResponseSchema>
export type AdminAnalyticsResponse = z.infer<typeof AdminAnalyticsResponseSchema>

