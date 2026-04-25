import { useQuery } from "@tanstack/react-query"

import { env } from "@/env"

const getBaseUrl = () =>
	(typeof window !== "undefined" ? env.NEXT_PUBLIC_API_BASE_URL : env.NEXT_PUBLIC_API_BASE_URL) ?? ""

function parseErrorBody(text: string): string {
	try {
		const data = JSON.parse(text)
		if (data.detail && typeof data.detail === "string") return data.detail
		if (typeof data === "object" && data !== null) {
			const parts = Object.entries(data).flatMap(([k, v]) =>
				Array.isArray(v) ? v.map((s: string) => `${k}: ${s}`) : [`${k}: ${String(v)}`]
			)
			if (parts.length) return parts.join(". ")
		}
	} catch {
		// ignore
	}
	return text || "Request failed"
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(parseErrorBody(body))
	}
	return res.json() as Promise<T>
}

export type AdminUserRow = {
	id: string
	name: string
	email: string
	role: string
	phone?: string | null
	emailVerified: boolean
	ownedPharmaciesCount: number
	staffAssignmentsCount: number
	reservationsCount: number
	createdAt: string
	updatedAt: string
}

export type AdminPharmacyRow = {
	id: string
	name: string
	ownerId: string
	ownerName: string
	ownerEmail?: string | null
	isActive: boolean
	certificateStatus: "pending" | "approved" | "rejected"
	certificateNumber?: string | null
	certificateFileUrl?: string | null
	certificateSubmittedAt?: string | null
	certificateReviewedAt?: string | null
	certificateReviewedBy?: string | null
	certificateReviewNote?: string | null
	customerVisible: boolean
	productCount: number
	reviewCount: number
	updatedAt: string
}

export type AdminProductRow = {
	id: string
	name: string
	pharmacyId?: string | null
	pharmacyName?: string | null
	ownerId?: string | null
	ownerName?: string | null
	categoryId: string
	categoryName?: string | null
	brandId?: string | null
	brandName?: string | null
	variantsCount: number
	inventoryTotal: number
	stockHealth: "ok" | "low" | "out"
	requiresPrescription: boolean
	updatedAt: string
}

export type AdminCategoryRow = {
	id: string
	name: string
	description?: string | null
	ownerId: string
	ownerName: string
	parentId?: string | null
	parentName?: string | null
	requiresPrescription: boolean
	productCount: number
	createdAt: string
	updatedAt: string
}

export type AdminReviewRow = {
	id: string
	reviewType: "pharmacy"
	pharmacyId: string
	pharmacyName?: string | null
	userId: string
	userName: string
	userEmail?: string | null
	rating: number
	comment?: string | null
	createdAt: string
}

export type AdminAuditEvent = {
	id: string
	createdAt: string
	actorRole?: "owner" | "staff" | "admin" | "customer" | null
	actorUserId?: string | null
	actor: string
	action: string
	resourceType: string
	resourceId?: string | null
	ownerId: string
	details: string
}

export type AdminDashboardResponse = {
	kpis: {
		usersTotal: number
		pharmaciesTotal: number
		productsTotal: number
		reservationsTotal: number
	}
	certificatePipeline: { pending: number; approved: number; rejected: number }
	monthlyReservations: { name: string; sales: number }[]
	topProducts: { name: string; value: number }[]
	topCategories: { name: string; value: number }[]
	topProductViews: { name: string; value: number }[]
	reviewDistribution: { name: string; value: number }[]
	topSearches: { items: { query: string; count: number }[] }
	noResultSearches: { items: { query: string; count: number }[] }
	recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
	recentCertificateSubmissions: {
		pharmacyId: string
		pharmacyName: string
		ownerId: string
		ownerName: string
		certificateStatus: "pending" | "approved" | "rejected"
		submittedAt?: string | null
	}[]
	recentAudits: { items: AdminAuditEvent[] }
}

export function useAdminUsersQuery(params?: { search?: string }) {
	const sp = new URLSearchParams()
	if (params?.search) sp.set("search", params.search)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "users", params?.search ?? ""],
		queryFn: () => apiFetch<AdminUserRow[]>(`/v1/admin/users/${suffix}`),
	})
}

export function useAdminPharmaciesQuery(params?: { certificateStatus?: AdminPharmacyRow["certificateStatus"]; search?: string }) {
	const sp = new URLSearchParams()
	if (params?.certificateStatus) sp.set("certificateStatus", params.certificateStatus)
	if (params?.search) sp.set("search", params.search)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "pharmacies", params?.certificateStatus ?? "all", params?.search ?? ""],
		queryFn: () => apiFetch<AdminPharmacyRow[]>(`/v1/admin/pharmacies/${suffix}`),
	})
}

export function useAdminProductsQuery(params?: { search?: string }) {
	const sp = new URLSearchParams()
	if (params?.search) sp.set("search", params.search)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "products", params?.search ?? ""],
		queryFn: () => apiFetch<AdminProductRow[]>(`/v1/admin/products/${suffix}`),
	})
}

export function useAdminCategoriesQuery(params?: { ownerId?: string; rx?: boolean; search?: string }) {
	const sp = new URLSearchParams()
	if (params?.ownerId) sp.set("ownerId", params.ownerId)
	if (params?.rx !== undefined) sp.set("rx", String(params.rx))
	if (params?.search) sp.set("search", params.search)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "categories", params?.ownerId ?? "", params?.rx ?? null, params?.search ?? ""],
		queryFn: () => apiFetch<AdminCategoryRow[]>(`/v1/admin/categories/${suffix}`),
	})
}

export function useAdminReviewsQuery(params?: { pharmacyId?: string; rating?: number; search?: string }) {
	const sp = new URLSearchParams()
	if (params?.pharmacyId) sp.set("pharmacyId", params.pharmacyId)
	if (params?.rating !== undefined) sp.set("rating", String(params.rating))
	if (params?.search) sp.set("search", params.search)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "reviews", params?.pharmacyId ?? "", params?.rating ?? null, params?.search ?? ""],
		queryFn: () => apiFetch<AdminReviewRow[]>(`/v1/admin/reviews/${suffix}`),
	})
}

export function useAdminAuditsQuery(params?: {
	actorRole?: "owner" | "staff" | "admin" | "customer"
	action?: string
	resourceType?: string
	ownerId?: string
	from?: string
	to?: string
	search?: string
	limit?: number
}) {
	const sp = new URLSearchParams()
	if (params?.actorRole) sp.set("actorRole", params.actorRole)
	if (params?.action) sp.set("action", params.action)
	if (params?.resourceType) sp.set("resourceType", params.resourceType)
	if (params?.ownerId) sp.set("ownerId", params.ownerId)
	if (params?.from) sp.set("from", params.from)
	if (params?.to) sp.set("to", params.to)
	if (params?.search) sp.set("search", params.search)
	if (params?.limit !== undefined) sp.set("limit", String(params.limit))
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "audits", params ?? {}],
		queryFn: () => apiFetch<AdminAuditEvent[]>(`/v1/admin/audits/${suffix}`),
	})
}

export function useAdminAnalyticsDashboardQuery(params?: { ownerId?: string }) {
	const sp = new URLSearchParams()
	if (params?.ownerId) sp.set("ownerId", params.ownerId)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "analytics", "dashboard", params?.ownerId ?? ""],
		queryFn: () => apiFetch<AdminDashboardResponse>(`/v1/admin/analytics/dashboard/${suffix}`),
	})
}

export function useAdminAnalyticsReportsQuery(params?: { ownerId?: string }) {
	const sp = new URLSearchParams()
	if (params?.ownerId) sp.set("ownerId", params.ownerId)
	const suffix = sp.toString() ? `?${sp.toString()}` : ""
	return useQuery({
		queryKey: ["admin", "analytics", "reports", params?.ownerId ?? ""],
		queryFn: () => apiFetch<AdminDashboardResponse>(`/v1/admin/analytics/reports/${suffix}`),
	})
}

