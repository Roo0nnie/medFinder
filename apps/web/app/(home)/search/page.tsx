import type { Route } from "next"
import Link from "next/link"

import { Button, buttonVariants } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { cn } from "@/core/lib/utils"
import { env } from "@/env"

type SearchPageProps = {
	searchParams: Promise<{
		q?: string
		categoryId?: string
		prefix?: string
		searchType?: "plain" | "websearch"
		page?: string
	}>
}

type ApiProduct = {
	id: string
	name: string
	brandName?: string | null
	genericName?: string | null
	description?: string | null
	dosageForm?: string | null
	strength?: string | null
	unit?: string | null
	categoryId: string
	variants?: { id: string; label: string; price?: number; quantity?: number }[] | null
}

function toInt(value: string | undefined, fallback: number) {
	if (!value) return fallback
	const n = Number.parseInt(value, 10)
	return Number.isFinite(n) ? n : fallback
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
	const sp = await searchParams
	const q = (sp.q ?? "").trim()
	const categoryId = (sp.categoryId ?? "").trim()
	const prefix = (sp.prefix ?? "").toLowerCase() === "true"
	const searchType = sp.searchType === "websearch" ? "websearch" : "plain"

	const page = Math.max(1, toInt(sp.page, 1))
	const limit = 24
	const offset = (page - 1) * limit

	const apiBase = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
	const qp = new URLSearchParams()
	if (q) qp.set("query", q)
	if (categoryId) qp.set("categoryId", categoryId)
	qp.set("limit", String(limit))
	qp.set("offset", String(offset))
	if (prefix) qp.set("prefix", "true")
	if (searchType) qp.set("searchType", searchType)

	const res = await fetch(`${apiBase}/v1/products/?${qp.toString()}`, { cache: "no-store" })
	const products: ApiProduct[] = res.ok ? await res.json() : []

	const nextHref =
		products.length < limit
			? null
			: (`/search?q=${encodeURIComponent(q)}&categoryId=${encodeURIComponent(categoryId)}&prefix=${String(prefix)}&searchType=${searchType}&page=${page + 1}` as Route)

	const prevHref =
		page <= 1
			? null
			: (`/search?q=${encodeURIComponent(q)}&categoryId=${encodeURIComponent(categoryId)}&prefix=${String(prefix)}&searchType=${searchType}&page=${page - 1}` as Route)

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
			<div className="mb-6 space-y-2">
				<h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Results are ranked using PostgreSQL Full‑Text Search.
				</p>
			</div>

			<form
				className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
				action="/search"
				method="get"
			>
				<div className="flex-1">
					<label className="text-muted-foreground mb-1 block text-sm" htmlFor="q">
						Query
					</label>
					<input
						id="q"
						name="q"
						defaultValue={q}
						placeholder="Search medicines, brands, dosage, strength..."
						className="border-input text-foreground focus:ring-ring h-9 w-full rounded-lg border bg-transparent px-3 text-sm focus:ring-2 focus:outline-none"
					/>
				</div>
				<div className="flex items-center gap-2">
					<input id="prefix" name="prefix" type="checkbox" defaultChecked={prefix} value="true" />
					<label htmlFor="prefix" className="text-muted-foreground text-sm">
						Prefix match
					</label>
				</div>
				<input type="hidden" name="searchType" value={searchType} />
				<Button type="submit" className="h-9">
					Search
				</Button>
			</form>

			{q && (
				<p className="text-muted-foreground mb-4 text-sm">
					Showing {products.length} result{products.length === 1 ? "" : "s"} for{" "}
					<span className="text-foreground font-medium">“{q}”</span>
				</p>
			)}

			{products.length === 0 ? (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<p className="text-foreground mb-1 font-medium">No results</p>
					<p className="text-muted-foreground text-sm">
						Try a different keyword, or enable prefix match.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{products.map(p => (
						<Link key={p.id} href={`/product/${p.id}` as Route} className="block">
							<Card className="hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
								<CardContent className="p-4 sm:p-5">
									<div className="min-w-0">
										<h3 className="text-foreground line-clamp-2 text-base font-semibold">
											{p.name}
										</h3>
										{(p.brandName || p.genericName) && (
											<p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
												{p.brandName ?? p.genericName}
											</p>
										)}
										{(p.dosageForm || p.strength) && (
											<p className="text-muted-foreground mt-2 text-sm">
												{[p.dosageForm, p.strength].filter(Boolean).join(" • ")}
											</p>
										)}
										{p.description && (
											<p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
												{p.description}
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
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
				<span className="text-muted-foreground text-sm">Page {page}</span>
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
