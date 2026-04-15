import type { Route } from "next"
import Link from "next/link"

import { buttonVariants } from "@/core/components/ui/button-variants"
import { cn } from "@/core/lib/utils"
import { env } from "@/env"
import {
	DEFAULT_PRODUCT_LIST_PAGE_SIZE,
	normalizeProductListPageSize,
	PAGE_SIZE_OPTIONS,
	type ProductListPageSize,
} from "@/features/products/lib/product-list-page-size"
import { getSession } from "@/services/better-auth/auth-server"
import { ChevronDown, Search } from "lucide-react"

import { SearchResultsClient } from "./search-results-client"

type SearchPageProps = {
	searchParams: Promise<{
		q?: string
		categoryId?: string
		prefix?: string
		searchType?: "plain" | "websearch"
		page?: string
		pageSize?: string
	}>
}

export type ApiProduct = {
	id: string
	name: string
	brandId?: string | null
	brandName?: string | null
	genericName?: string | null
	description?: string | null
	dosageForm?: string | null
	strength?: string | null
	unit?: string | null
	imageUrl?: string | null
	imageUrls?: string[] | null
	rating?: number | null
	categoryId: string
	variants?: {
		id: string
		label: string
		price?: number
		quantity?: number
		lowStockThreshold?: number
		strength?: string | null
		dosageForm?: string | null
		imageUrl?: string | null
		imageUrls?: string[] | null
	}[] | null
}

function parseSearchApiError(status: number, statusText: string, bodyText: string): string {
	let detail = ""
	try {
		const parsed = JSON.parse(bodyText) as { detail?: unknown; error?: unknown; message?: unknown }
		if (typeof parsed.detail === "string" && parsed.detail.trim()) detail = parsed.detail.trim()
		else if (typeof parsed.error === "string" && parsed.error.trim()) detail = parsed.error.trim()
		else if (typeof parsed.message === "string" && parsed.message.trim()) detail = parsed.message.trim()
	} catch {
		// ignore JSON parse failures
	}

	if (!detail) {
		const trimmed = bodyText.trim()
		if (trimmed) detail = trimmed.slice(0, 240)
	}

	const statusLabel = statusText ? `${status} ${statusText}` : String(status)
	return detail ? `${statusLabel}: ${detail}` : `${statusLabel}: Product search request failed`
}

function toInt(value: string | undefined, fallback: number) {
	if (!value) return fallback
	const n = Number.parseInt(value, 10)
	return Number.isFinite(n) ? n : fallback
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
	const session = await getSession()
	const sp = await searchParams
	const q = (sp.q ?? "").trim()
	const categoryId = (sp.categoryId ?? "").trim()
	const prefix = (sp.prefix ?? "").toLowerCase() === "true"
	const searchType = sp.searchType === "websearch" ? "websearch" : "plain"

	const page = Math.max(1, toInt(sp.page, 1))
	const resolvedPageSize = normalizeProductListPageSize(
		toInt(sp.pageSize, DEFAULT_PRODUCT_LIST_PAGE_SIZE)
	) as ProductListPageSize
	const limit = resolvedPageSize
	const offset = (page - 1) * limit

	const apiBase = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
	const qp = new URLSearchParams()
	if (q) qp.set("query", q)
	if (categoryId) qp.set("categoryId", categoryId)
	qp.set("limit", String(limit))
	qp.set("offset", String(offset))
	if (prefix) qp.set("prefix", "true")
	if (searchType) qp.set("searchType", searchType)

	let products: ApiProduct[] = []
	let searchError: string | null = null
	try {
		const res = await fetch(`${apiBase}/v1/products/?${qp.toString()}`, { cache: "no-store" })
		if (!res.ok) {
			const bodyText = await res.text()
			searchError = parseSearchApiError(res.status, res.statusText, bodyText)
		} else {
			products = await res.json()
		}
	} catch (error) {
		searchError = error instanceof Error ? error.message : "Failed to reach product search API"
	}

	const nextHref =
		products.length < limit
			? null
			: (`/search?q=${encodeURIComponent(q)}&categoryId=${encodeURIComponent(categoryId)}&prefix=${String(prefix)}&searchType=${searchType}&pageSize=${String(resolvedPageSize)}&page=${page + 1}` as Route)

	const prevHref =
		page <= 1
			? null
			: (`/search?q=${encodeURIComponent(q)}&categoryId=${encodeURIComponent(categoryId)}&prefix=${String(prefix)}&searchType=${searchType}&pageSize=${String(resolvedPageSize)}&page=${page - 1}` as Route)

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
			<div className="mb-6 space-y-2">
				<h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Results are ranked using PostgreSQL Full-Text Search.
				</p>
			</div>

			<form
    className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
    action="/search"
    method="get"
>
    {/* Left Column: Query Input */}
    <div className="w-full sm:max-w-md">
        <label className="text-muted-foreground mb-1 block text-sm" htmlFor="q">
            Query
        </label>
        <div className="relative">
            <Search
                aria-hidden
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Search medicines, brands, dosage, strength..."
                className="border-input text-foreground focus:ring-ring h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm focus:ring-2 focus:outline-none"
            />
        </div>
        <label className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <input id="prefix" name="prefix" type="checkbox" defaultChecked={prefix} value="true" />
            <span>Prefix match</span>
        </label>
    </div>

    {/* Right Column: Per Page & Search Button */}
    {/* We use sm:ml-auto to push to the right, and pb-[28px] (approx) or a nested flex to align with the top input */}
    <div className="flex flex-col gap-2 sm:ml-auto sm:mb-[28px]"> 
        <div className="flex flex-wrap items-center gap-4">
            <label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
                <span>Per page</span>
                <span className="relative inline-block">
                    <select
                        id="pageSize"
                        name="pageSize"
                        defaultValue={String(resolvedPageSize)}
                        className="border-input bg-background text-foreground focus:ring-ring h-9 w-full min-w-18 cursor-pointer appearance-none rounded-lg border py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
                        aria-label="Products per page"
                    >
                        {PAGE_SIZE_OPTIONS.map(n => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        aria-hidden
                        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 opacity-70"
                    />
                </span>
            </label>

            <button type="submit" className={buttonVariants({ size: "default" })}>
                <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" aria-hidden />
                    Search
                </span>
            </button>
        </div>
    </div>
    
    <input type="hidden" name="searchType" value={searchType} />
    <input type="hidden" name="page" value="1" />
</form>

			{q && (
				<p className="text-muted-foreground mb-4 text-sm">
					Showing {products.length} result{products.length === 1 ? "" : "s"} for{" "}
					<span className="text-foreground font-medium">"{q}"</span>
				</p>
			)}

			{searchError ? (
				<div className="border-destructive/30 bg-destructive/5 rounded-xl border px-6 py-6">
					<p className="text-destructive mb-1 font-medium">Search API error</p>
					<p className="text-muted-foreground text-sm">{searchError}</p>
				</div>
			) : products.length === 0 ? (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<p className="text-foreground mb-1 font-medium">No results</p>
					<p className="text-muted-foreground text-sm">
						Try a different keyword, or enable prefix match.
					</p>
				</div>
			) : (
				<SearchResultsClient
					products={products}
					isCustomer={(session?.user as { role?: string } | undefined)?.role === "customer"}
				/>
			)}

			<div className="mt-8 flex items-center justify-between">
				<Link
					href={(prevHref ?? "/search") as Route}
					aria-disabled={!prevHref}
					className={cn(
						buttonVariants({ variant: "outline", size: "lg" }),
						!prevHref && "pointer-events-none opacity-50"
					)}
				>
					Previous
				</Link>
				<span className="text-muted-foreground text-sm">
					Page {page} · {resolvedPageSize} per page
				</span>
				<Link
					href={(nextHref ?? "/search") as Route}
					aria-disabled={!nextHref}
					className={cn(
						buttonVariants({ variant: "outline", size: "lg" }),
						!nextHref && "pointer-events-none opacity-50"
					)}
				>
					Next
				</Link>
			</div>
		</div>
	)
}
