"use client"

import type { Route } from "next"
import Link from "next/link"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { useAuth } from "@/services/better-auth/context/auth-provider"
import { Search } from "lucide-react"

export type LandingHeroStats = {
	approvedPharmaciesCount: number | null
	productsCount: number | null
	variantsCount: number | null
}

function formatCount(value: number | null | undefined) {
	if (value == null) return "—"
	return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value)
}

export function LandingHero({ stats }: { stats?: LandingHeroStats }) {
	const { session, isLoading } = useAuth()
	const isAuthenticated = Boolean(session?.user?.id)

	const statItems = [
		{ value: formatCount(stats?.approvedPharmaciesCount), label: "Pharmacies" },
		{ value: formatCount(stats?.productsCount), label: "Products" },
		{ value: formatCount(stats?.variantsCount), label: "Variants" },
	] as const

	return (
		<div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
			<div className="space-y-7">
				<div className="space-y-3">
					<h1 className="animate-fade-in-up text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
						Find any medication, fast.
						<span className="text-primary block">Across trusted pharmacies.</span>
					</h1>
					<p className="animate-fade-in-up animate-delay-200 text-muted-foreground max-w-xl text-base text-balance sm:text-lg">
						Type a product name, brand, or generic. Results are ranked using PostgreSQL
						Full-Text Search.
					</p>
				</div>

				<form
					className="animate-fade-in-up animate-delay-300"
					action="/search"
					method="get"
				>
					<div className="bg-background/70 border-input focus-within:ring-ring relative flex w-full max-w-2xl items-center gap-2 rounded-full border px-4 py-3 shadow-sm backdrop-blur-sm transition-shadow focus-within:ring-2 hover:shadow-md">
						<Search aria-hidden className="text-muted-foreground h-5 w-5 shrink-0" />
						<input
							id="q"
							name="q"
							type="search"
							placeholder="Search medicines, brands, dosage, strength…"
							className="placeholder:text-muted-foreground text-foreground w-full bg-transparent text-base outline-none"
							autoComplete="off"
						/>
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-3">
						{!isAuthenticated && !isLoading ? (
							<Link href={"/login" as Route}>
								<Button size="lg" variant="outline">
									Get started
								</Button>
							</Link>
						) : (
							<a
								href="#find-product"
								className="text-primary text-sm font-medium underline-offset-4 transition-colors hover:underline"
								onClick={e => {
									e.preventDefault()
									document
										.getElementById("find-product")
										?.scrollIntoView({ behavior: "smooth", block: "start" })
								}}
							>
								Find products →
							</a>
						)}
						<a
							href="#pharmacy"
							className="text-muted-foreground text-sm font-medium underline-offset-4 transition-colors hover:underline"
							onClick={(e) => {
								e.preventDefault()
								document
									.getElementById("pharmacy")
									?.scrollIntoView({ behavior: "smooth", block: "start" })
							}}
						>
							Browse pharmacies
						</a>
					</div>
				</form>

				<div className="animate-fade-in-up animate-delay-400 flex flex-wrap gap-4 pt-1">
					{statItems.map((stat, i) => (
						<div
							key={stat.label}
							className={`animate-scale-in animate-delay-${(i + 4) * 100} bg-primary/5 border-primary/10 flex items-center gap-2 rounded-full border px-4 py-2`}
						>
							<span className="text-primary text-lg font-bold">{stat.value}</span>
							<span className="text-muted-foreground text-sm">{stat.label}</span>
						</div>
					))}
				</div>
			</div>

			<div className="animate-fade-in-right animate-delay-300 max-w-md justify-self-center md:justify-self-end">
				<Card className="border-primary/20 from-primary/5 via-background to-primary/10 bg-linear-to-br shadow-sm transition-shadow duration-300 hover:shadow-lg">
					<CardContent className="space-y-4 p-6">
						<p className="text-primary text-sm font-medium">Why MedFinder?</p>
						<ul className="text-muted-foreground space-y-3 text-sm">
							<li className="flex items-start gap-2">
								<span className="text-primary mt-0.5 text-base leading-none">✦</span>
								<span>Search across multiple pharmacies in one place.</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-primary mt-0.5 text-base leading-none">✦</span>
								<span>See availability and variants (dosage/strength) quickly.</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-primary mt-0.5 text-base leading-none">✦</span>
								<span>Results ranked by full‑text relevance, not just alphabetical.</span>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
