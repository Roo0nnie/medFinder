"use client"

import { useEffect, useMemo, useState } from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { useInView } from "@/core/hooks/use-in-view"
import { useLandingCatalog } from "@/features/landing/api/catalog.hooks"
import type { LandingPharmacy } from "@/features/landing/data/types"
import {
	DEFAULT_PRODUCT_LIST_PAGE_SIZE,
	getStoredProductListPageSize,
	normalizeProductListPageSize,
	PAGE_SIZE_OPTIONS,
	PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY,
	setStoredProductListPageSize,
	type ProductListPageSize,
} from "@/features/products/lib/product-list-page-size"
import { ChevronDown, ExternalLink, Phone, Search, Star } from "lucide-react"

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

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n))
}

function buildOsmEmbedUrl(lat: number, lng: number) {
	// Roughly ~2km span at equator; good enough for a small preview card.
	const delta = 0.02
	const left = clamp(lng - delta, -180, 180)
	const right = clamp(lng + delta, -180, 180)
	const top = clamp(lat + delta, -90, 90)
	const bottom = clamp(lat - delta, -90, 90)
	const bbox = `${left},${bottom},${right},${top}`
	return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(
		`${lat},${lng}`
	)}`
}

function buildOsmViewUrl(lat: number, lng: number) {
	return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(lat))}&mlon=${encodeURIComponent(
		String(lng)
	)}#map=16/${encodeURIComponent(String(lat))}/${encodeURIComponent(String(lng))}`
}

function PharmacyCard({ store }: { store: LandingPharmacy }) {
	const lat = typeof store.latitude === "number" ? store.latitude : undefined
	const lng = typeof store.longitude === "number" ? store.longitude : undefined
	const hasCoords = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
	const mapHref = hasCoords ? buildOsmViewUrl(lat, lng) : undefined
	const mapEmbed = hasCoords ? buildOsmEmbedUrl(lat, lng) : undefined

	return (
		<Card className="border-border/60 group-hover:border-primary/30 bg-card flex min-h-0 min-w-0 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
			<CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
				<div className="flex min-w-0 items-start gap-3">
					<div className="bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors">
						<LocationIcon className="h-5 w-5" />
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex min-w-0 items-center justify-between gap-3">
							<h3 className="text-foreground min-w-0 truncate text-base font-semibold sm:text-lg">
								{store.name}
							</h3>

							{typeof store.rating === "number" && Number.isFinite(store.rating) && (
								<span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
									<Star className="h-3.5 w-3.5 fill-current" aria-hidden />
									{store.rating.toFixed(1)}
								</span>
							)}
						</div>

						<p className="text-muted-foreground mt-1 flex items-start gap-2 text-sm">
							<LocationIcon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
							<span className="min-w-0 wrap-break-word">{store.address}</span>
						</p>

						<p className="text-muted-foreground mt-1 truncate text-sm">
							{store.municipality}, {store.city}
						</p>

						<div className="mt-3 flex flex-wrap gap-2">
							{store.operatingHours && (
								<span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1 text-xs">
									{store.operatingHours}
								</span>
							)}
							{store.phone && (
								<span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs">
									<Phone className="h-3.5 w-3.5" aria-hidden />
									{store.phone}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="border-border bg-muted/20 relative overflow-hidden rounded-lg border">
					<div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-black/5 dark:to-white/5" />
					{mapEmbed ? (
						<iframe
							title={`${store.name} map preview`}
							src={mapEmbed}
							className="relative block h-28 w-full sm:h-32"
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						/>
					) : (
						<div className="relative flex h-28 w-full items-center justify-center sm:h-32">
							<div className="text-muted-foreground text-center text-xs sm:text-sm">
								Map unavailable
								<div className="text-muted-foreground/80 mt-0.5 text-[11px]">
									Missing coordinates for this pharmacy.
								</div>
							</div>
						</div>
					)}

					{mapHref && (
						<a
							href={mapHref}
							target="_blank"
							rel="noreferrer"
							onClick={e => e.stopPropagation()}
							className="bg-background/80 text-foreground hover:bg-background absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm backdrop-blur"
						>
							View map <ExternalLink className="h-3.5 w-3.5" aria-hidden />
						</a>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

export function LandingPharmacySection({ isCustomer = false }: { isCustomer?: boolean }) {
	const router = useRouter()
	const [cityFilter, setCityFilter] = useState("")
	const [query, setQuery] = useState("")
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<ProductListPageSize>(DEFAULT_PRODUCT_LIST_PAGE_SIZE)

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
			(cityFilter
				? pharmacies.filter(s => s.city === cityFilter || s.municipality.includes(cityFilter))
				: pharmacies
			).filter(s => {
				const q = query.trim().toLowerCase()
				if (!q) return true
				return (
					s.name.toLowerCase().includes(q) ||
					s.city.toLowerCase().includes(q) ||
					s.municipality.toLowerCase().includes(q) ||
					s.address.toLowerCase().includes(q)
				)
			}),
		[cityFilter, pharmacies, query]
	)

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
	const safePage = Math.min(page, totalPages)
	const paged = useMemo(() => {
		const start = (safePage - 1) * pageSize
		return filtered.slice(start, start + pageSize)
	}, [filtered, safePage, pageSize])

	useEffect(() => {
		setPage(1)
	}, [cityFilter, query])

	useEffect(() => {
		setPage(1)
	}, [pageSize])

	useEffect(() => {
		setPage(p => Math.min(p, totalPages))
	}, [totalPages])

	useEffect(() => {
		setPageSize(getStoredProductListPageSize())
		const onStorage = (e: StorageEvent) => {
			if (e.key !== PRODUCT_LIST_PAGE_SIZE_STORAGE_KEY || e.newValue == null) return
			const n = Number.parseInt(e.newValue, 10)
			if (Number.isFinite(n)) setPageSize(normalizeProductListPageSize(n))
		}
		window.addEventListener("storage", onStorage)
		return () => window.removeEventListener("storage", onStorage)
	}, [])

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

			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-md">
					<Search
						aria-hidden
						className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
					/>
					<Input
						type="search"
						placeholder="Search pharmacy name or location..."
						value={query}
						onChange={e => setQuery(e.target.value)}
						onKeyDown={e => {
							if (e.key !== "Enter") return
							e.preventDefault()
							const q = query.trim()
							if (!q) return
							if (isCustomer) {
								router.push(`/pharmacies?q=${encodeURIComponent(q)}` as Route)
							} else {
								setRegisterModalOpen(true)
							}
						}}
						className="w-full pl-9"
						aria-label="Search pharmacies"
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2 sm:gap-3">
					<label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
						<span>Per page</span>
						<span className="relative inline-block">
							<select
								value={String(pageSize)}
								onChange={e => {
									const v = Number(e.target.value) as ProductListPageSize
									setPageSize(v)
									setStoredProductListPageSize(v)
								}}
								className="border-input bg-background text-foreground focus:ring-ring h-8 w-full min-w-18 cursor-pointer appearance-none rounded-lg border py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
								aria-label="Pharmacies per page"
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
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 sm:gap-4">
				<span className="text-muted-foreground w-full text-sm sm:w-auto">Filters:</span>
				<div className="relative min-w-0 flex-1 sm:min-w-[160px] sm:flex-none md:min-w-[180px]">
					<LocationIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2" />
					<select
						id="pharmacy-location"
						value={cityFilter}
						onChange={e => setCityFilter(e.target.value)}
						className="border-input bg-background text-foreground focus:ring-ring h-8 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pl-9 pr-10 text-sm focus:ring-2 focus:outline-none scheme-light dark:scheme-dark"
						aria-label="Filter by location"
					>
						<option value="">All locations</option>
						{cities.map(c => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
					<ChevronDown
						aria-hidden
						className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-10 h-4 w-4 -translate-y-1/2 opacity-70"
					/>
				</div>
			</div>

			<p className="text-muted-foreground text-sm">
				{filtered.length} result{filtered.length !== 1 ? "s" : ""}
			</p>

			<div
				ref={gridRef}
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
			>
				{paged.map((store, i) => (
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

			{filtered.length > 0 && (
				<div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
					<p className="text-muted-foreground text-sm">
						Page {safePage} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setPage(p => Math.max(1, p - 1))}
							disabled={safePage <= 1}
							className="border-input bg-background text-foreground inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
						>
							Prev
						</button>
						<button
							type="button"
							onClick={() => setPage(p => Math.min(totalPages, p + 1))}
							disabled={safePage >= totalPages}
							className="border-input bg-background text-foreground inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			)}

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
