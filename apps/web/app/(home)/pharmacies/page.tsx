import type { Route } from "next"
import Link from "next/link"

import { Card, CardContent } from "@/core/components/ui/card"
import { Button, buttonVariants } from "@/core/components/ui/button"
import { cn } from "@/core/lib/utils"
import { env } from "@/env"

type PharmaciesPageProps = {
	searchParams: Promise<{
		q?: string
		city?: string
		state?: string
		page?: string
	}>
}

type ApiPharmacy = {
	id: string
	name: string
	address?: string | null
	city?: string | null
	municipality?: string | null
	state?: string | null
	zipCode?: string | null
}

function toInt(value: string | undefined, fallback: number) {
	if (!value) return fallback
	const n = Number.parseInt(value, 10)
	return Number.isFinite(n) ? n : fallback
}

export default async function PharmaciesPage({ searchParams }: PharmaciesPageProps) {
	const sp = await searchParams
	const q = (sp.q ?? "").trim()
	const city = (sp.city ?? "").trim()
	const state = (sp.state ?? "").trim()

	const page = Math.max(1, toInt(sp.page, 1))
	const limit = 24
	const offset = (page - 1) * limit

	const apiBase = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
	const qp = new URLSearchParams()
	if (q) qp.set("search", q)
	if (city) qp.set("city", city)
	if (state) qp.set("state", state)

	// Note: backend pharmacies list currently doesn't support limit/offset.
	// We still paginate client-side to keep URLs stable as you evolve the API.
	const res = await fetch(`${apiBase}/v1/pharmacies/?${qp.toString()}`, { cache: "no-store" })
	const all: ApiPharmacy[] = res.ok ? await res.json() : []
	const pharmacies = all.slice(offset, offset + limit)

	const nextHref =
		all.length <= offset + limit
			? null
			: (`/pharmacies?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&page=${page + 1}` as Route)

	const prevHref =
		page <= 1
			? null
			: (`/pharmacies?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&page=${page - 1}` as Route)

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
			<div className="mb-6 space-y-2">
				<h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Pharmacies</h1>
				<p className="text-muted-foreground text-sm sm:text-base">Search pharmacies by name or location.</p>
			</div>

			<form className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end" action="/pharmacies" method="get">
				<div className="flex-1">
					<label className="text-muted-foreground mb-1 block text-sm" htmlFor="q">
						Search
					</label>
					<input
						id="q"
						name="q"
						defaultValue={q}
						placeholder="Search pharmacy name..."
						className="border-input text-foreground focus:ring-ring h-9 w-full rounded-lg border bg-transparent px-3 text-sm focus:ring-2 focus:outline-none"
					/>
				</div>
				<div className="flex-1">
					<label className="text-muted-foreground mb-1 block text-sm" htmlFor="city">
						City
					</label>
					<input
						id="city"
						name="city"
						defaultValue={city}
						placeholder="Optional"
						className="border-input text-foreground focus:ring-ring h-9 w-full rounded-lg border bg-transparent px-3 text-sm focus:ring-2 focus:outline-none"
					/>
				</div>
				<div className="w-full sm:w-40">
					<label className="text-muted-foreground mb-1 block text-sm" htmlFor="state">
						State
					</label>
					<input
						id="state"
						name="state"
						defaultValue={state}
						placeholder="Optional"
						className="border-input text-foreground focus:ring-ring h-9 w-full rounded-lg border bg-transparent px-3 text-sm focus:ring-2 focus:outline-none"
					/>
				</div>
				<Button type="submit" className="h-9">
					Search
				</Button>
			</form>

			{all.length === 0 ? (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<p className="text-foreground mb-1 font-medium">No pharmacies found</p>
					<p className="text-muted-foreground text-sm">Try adjusting your search or location.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{pharmacies.map(p => (
						<Link key={p.id} href={`/pharmacy/${p.id}` as Route} className="block">
							<Card className="hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
								<CardContent className="p-4 sm:p-5">
									<h3 className="text-foreground line-clamp-2 text-base font-semibold">{p.name}</h3>
									<p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
										{[p.address, p.municipality, p.city, p.state].filter(Boolean).join(", ")}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}

			<div className="mt-8 flex items-center justify-between">
				<Link
					href={(prevHref ?? "/pharmacies") as Route}
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
					href={(nextHref ?? "/pharmacies") as Route}
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

