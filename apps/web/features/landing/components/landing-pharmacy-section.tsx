"use client"

import { useMemo, useState } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { useInView } from "@/core/hooks/use-in-view"
import { useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import type { LandingPharmacy } from "@/features/landing/data/types"

import { LandingRegisterModal } from "./landing-register-modal"

function LocationIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
	)
}

function PharmacyCard({ store }: { store: LandingPharmacy }) {
	return (
		<Card className="hover:border-primary/20 flex min-h-0 min-w-0 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
			<CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
				<div className="flex gap-3">
					<div className="bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors">
						<LocationIcon className="text-primary h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="text-foreground truncate text-base font-semibold sm:text-lg">
							{store.name}
						</h3>
						<p className="text-muted-foreground mt-1 flex items-start gap-2 text-sm">
							<LocationIcon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
							<span className="min-w-0 wrap-break-word">{store.address}</span>
						</p>
						<p className="text-muted-foreground mt-1 truncate text-sm">
							{store.municipality}, {store.city}
						</p>
					</div>
				</div>
				<div className="border-border bg-muted/30 mt-4 flex h-20 shrink-0 items-center justify-center rounded-lg border sm:h-24">
					<span className="text-muted-foreground text-xs sm:text-sm">Map placeholder</span>
				</div>
			</CardContent>
		</Card>
	)
}

export function LandingPharmacySection({ isCustomer = false }: { isCustomer?: boolean }) {
	const router = useRouter()
	const [cityFilter, setCityFilter] = useState("")
	const [registerModalOpen, setRegisterModalOpen] = useState(false)

	const { ref: headingRef, isInView: headingInView } = useInView<HTMLDivElement>()
	const { ref: gridRef, isInView: gridInView } = useInView<HTMLDivElement>({ threshold: 0.05 })
	const { data: catalog } = useLandingCatalog()
	const pharmacies: LandingPharmacy[] = catalog?.pharmacies ?? []

	const cities = useMemo(
		() =>
			Array.from(new Set(pharmacies.flatMap(s => [s.city, s.municipality].filter(Boolean)))).sort(),
		[pharmacies]
	)
	const filtered = useMemo(
		() =>
			cityFilter
				? pharmacies.filter(s => s.city === cityFilter || s.municipality.includes(cityFilter))
				: pharmacies,
		[cityFilter, pharmacies]
	)

	return (
		<div className="w-full space-y-6">
			<section
				ref={headingRef}
				className={`space-y-2 transition-all duration-700 ${headingInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
			>
				<h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
					Pharmacy locations
				</h2>
				<p className="text-muted-foreground text-base sm:text-lg">
					Find pharmacies near you. Filter by city or municipality.
				</p>
			</section>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<label htmlFor="pharmacy-location" className="text-foreground shrink-0 text-sm font-medium">
					Filter by location
				</label>
				<select
					id="pharmacy-location"
					value={cityFilter}
					onChange={e => setCityFilter(e.target.value)}
					className="border-input text-foreground focus:ring-ring h-9 min-w-0 flex-1 rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:outline-none sm:min-w-[200px] sm:flex-none"
				>
					<option value="">All locations</option>
					{cities.map(c => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
			</div>

			<div
				ref={gridRef}
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			>
				{filtered.map((store, i) => (
					<div
						key={store.id}
						role="button"
						tabIndex={0}
						className={`group focus-visible:ring-ring cursor-pointer rounded-xl transition-all duration-500 outline-none focus-visible:ring-2 ${
							gridInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
						}`}
						style={{ transitionDelay: gridInView ? `${Math.min(i, 7) * 80}ms` : "0ms" }}
						onClick={() => {
							if (isCustomer) {
								router.push(`/pharmacy/${store.id}` as Route)
							} else {
								setRegisterModalOpen(true)
							}
						}}
						onKeyDown={e => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault()
								if (isCustomer) {
									router.push(`/pharmacy/${store.id}` as Route)
								} else {
									setRegisterModalOpen(true)
								}
							}
						}}
					>
						<PharmacyCard store={store} />
					</div>
				))}
			</div>

			<LandingRegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />

			{filtered.length === 0 && (
				<div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
					<LocationIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<p className="text-foreground font-medium">No pharmacies in this location</p>
					<p className="text-muted-foreground mt-1 text-sm">
						Try selecting a different location or view all pharmacies.
					</p>
				</div>
			)}
		</div>
	)
}
