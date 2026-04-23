import { useQuery } from "@tanstack/react-query"

import { env } from "@/env"

import type {
	AuditEventsResponse,
	OwnerStats,
	MonthlySalesPoint,
	OwnerTopSearchesResponse,
	PeakHourPoint,
	ReviewRatingPoint,
	SearchTrendPoint,
	TopProduct,
} from "@repo/contracts"

const getBaseUrl = () =>
	(typeof window !== "undefined" ? env.NEXT_PUBLIC_API_BASE_URL : env.NEXT_PUBLIC_API_BASE_URL) ?? ""

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
		throw new Error(body || `Request failed: ${res.status}`)
	}
	return res.json() as Promise<T>
}

export function useOwnerStatsQuery() {
	return useQuery({
		queryKey: ["analytics", "owner-stats"],
		queryFn: () => apiFetch<OwnerStats>("/v1/analytics/owner-stats/"),
	})
}

export function useMonthlyReservationTrendQuery() {
	return useQuery({
		queryKey: ["analytics", "monthly-sales", "owner"],
		queryFn: () => apiFetch<MonthlySalesPoint[]>("/v1/analytics/monthly-sales/"),
	})
}

export function useOwnerReviewRatingsQuery() {
	return useQuery({
		queryKey: ["analytics", "owner-review-ratings"],
		queryFn: () => apiFetch<ReviewRatingPoint[]>("/v1/analytics/owner-review-ratings/"),
	})
}

export function useTopProductsByInventoryQuery(limit = 10) {
	return useQuery({
		queryKey: ["analytics", "top-products", "owner", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(`/v1/analytics/top-products/?limit=${encodeURIComponent(String(limit))}`),
	})
}

export function useOwnerTopCategoriesQuery(limit = 8) {
	return useQuery({
		queryKey: ["analytics", "owner-top-categories", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-top-categories/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerTopSearchesQuery(limit = 20) {
	return useQuery({
		queryKey: ["analytics", "owner-top-searches", limit],
		queryFn: () =>
			apiFetch<OwnerTopSearchesResponse>(
				`/v1/analytics/owner-top-searches/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerTopProductsByViewsQuery(limit = 10) {
	return useQuery({
		queryKey: ["analytics", "owner-top-products-by-views", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-top-products-by-views/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerTopStaffByAuditActionsQuery(limit = 10) {
	return useQuery({
		queryKey: ["analytics", "owner-top-staff-by-audit-actions", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-top-staff-by-audit-actions/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerSearchTrendsQuery(granularity: "daily" | "weekly" = "daily") {
	return useQuery({
		queryKey: ["analytics", "owner-search-trends", granularity],
		queryFn: () =>
			apiFetch<SearchTrendPoint[]>(
				`/v1/analytics/owner-search-trends/?granularity=${encodeURIComponent(granularity)}`
			),
	})
}

export function useOwnerSearchPeakHoursQuery() {
	return useQuery({
		queryKey: ["analytics", "owner-search-peak-hours"],
		queryFn: () => apiFetch<PeakHourPoint[]>("/v1/analytics/owner-search-peak-hours/"),
	})
}

export function useOwnerNoResultSearchesQuery(limit = 25) {
	return useQuery({
		queryKey: ["analytics", "owner-no-result-searches", limit],
		queryFn: () =>
			apiFetch<OwnerTopSearchesResponse>(
				`/v1/analytics/owner-no-result-searches/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerBottomProductsByViewsQuery(limit = 10) {
	return useQuery({
		queryKey: ["analytics", "owner-bottom-products-by-views", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-bottom-products-by-views/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export function useOwnerTrendingProductsByViewsQuery(limit = 10, windowDays = 7) {
	return useQuery({
		queryKey: ["analytics", "owner-trending-products-by-views", limit, windowDays],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-trending-products-by-views/?limit=${encodeURIComponent(String(limit))}&windowDays=${encodeURIComponent(String(windowDays))}`
			),
	})
}

export function useOwnerHighDemandOutOfStockQuery(limit = 10, engagementDays = 30) {
	return useQuery({
		queryKey: ["analytics", "owner-high-demand-out-of-stock", limit, engagementDays],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-high-demand-out-of-stock/?limit=${encodeURIComponent(String(limit))}&engagementDays=${encodeURIComponent(String(engagementDays))}`
			),
	})
}

export function useOwnerAuditEventsQuery(limit = 200) {
	return useQuery({
		queryKey: ["analytics", "audit-events", limit],
		queryFn: () =>
			apiFetch<AuditEventsResponse>(
				`/v1/analytics/audit-events/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}

export async function postAuditEvent(input: {
	action: "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT"
	resourceType: string
	resourceId?: string | null
	details?: string | null
}): Promise<void> {
	try {
		await apiFetch<{ success: boolean }>("/v1/analytics/audit-events/", {
			method: "POST",
			body: JSON.stringify({
				action: input.action,
				resourceType: input.resourceType,
				resourceId: input.resourceId ?? undefined,
				details: input.details ?? undefined,
			}),
		})
	} catch {
		/* non-fatal */
	}
}

/** Owner/staff session telemetry for audit log (best-effort; failures ignored). */
export async function postSessionAuditEvent(event: "login" | "logout"): Promise<void> {
	try {
		await apiFetch<{ success: boolean }>("/v1/analytics/session-audit/", {
			method: "POST",
			body: JSON.stringify({ event }),
		})
	} catch {
		/* non-fatal */
	}
}

export function useOwnerTopProductsBySearchSelectionsQuery(limit = 10) {
	return useQuery({
		queryKey: ["analytics", "owner-top-products-by-search-selections", limit],
		queryFn: () =>
			apiFetch<TopProduct[]>(
				`/v1/analytics/owner-top-products-by-search-selections/?limit=${encodeURIComponent(String(limit))}`
			),
	})
}
