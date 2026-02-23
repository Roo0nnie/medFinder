"use client"

import type { Route } from "next"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { landingPharmacies } from "@/features/landing/data/pharmacies"
import type { LandingPharmacy } from "@/features/landing/data/types"
import { LandingRegisterModal } from "./landing-register-modal"

function LocationIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden
		>
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
		<Card className="flex min-h-0 min-w-0 overflow-hidden transition-shadow hover:shadow-md">
			<CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
				<div className="flex gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<LocationIcon className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-semibold text-foreground text-base sm:text-lg">{store.name}</h3>
						<p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
							<LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<span className="min-w-0 wrap-break-word">{store.address}</span>
						</p>
						<p className="mt-1 truncate text-sm text-muted-foreground">
							{store.municipality}, {store.city}
						</p>
					</div>
				</div>
				<div className="mt-4 flex h-20 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30 sm:h-24">
					<span className="text-xs text-muted-foreground sm:text-sm">Map placeholder</span>
				</div>
			</CardContent>
		</Card>
	)
}

export function LandingPharmacySection({ isCustomer = false }: { isCustomer?: boolean }) {
	const router = useRouter()
	const [cityFilter, setCityFilter] = useState("")
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const cities = useMemo(
		() =>
			Array.from(
				new Set(landingPharmacies.flatMap((s) => [s.city, s.municipality].filter(Boolean)))
			).sort(),
		[]
	)
	const filtered = useMemo(
		() =>
			cityFilter
				? landingPharmacies.filter(
						(s) => s.city === cityFilter || s.municipality.includes(cityFilter)
					)
				: landingPharmacies,
		[cityFilter]
	)

	return (
		<div className="w-full space-y-6">
			<section className="space-y-2">
				<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Pharmacy locations
				</h2>
				<p className="text-muted-foreground text-base sm:text-lg">
					Find pharmacies near you. Filter by city or municipality.
				</p>
			</section>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<label
					htmlFor="pharmacy-location"
					className="shrink-0 text-sm font-medium text-foreground"
				>
					Filter by location
				</label>
				<select
					id="pharmacy-location"
					value={cityFilter}
					onChange={(e) => setCityFilter(e.target.value)}
					className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:min-w-[200px] sm:flex-none"
				>
					<option value="">All locations</option>
					{cities.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{filtered.map((store) => (
					<div
						key={store.id}
						role="button"
						tabIndex={0}
						className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
						onClick={() => {
							if (isCustomer) {
								router.push(`/pharmacy/${store.id}` as Route)
							} else {
								setRegisterModalOpen(true)
							}
						}}
						onKeyDown={(e) => {
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
				<div className="text-center py-16 px-6 rounded-xl border border-border bg-card">
					<LocationIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
					<p className="text-foreground font-medium">No pharmacies in this location</p>
					<p className="text-muted-foreground text-sm mt-1">
						Try selecting a different location or view all pharmacies.
					</p>
				</div>
			)}
		</div>
	)
}
