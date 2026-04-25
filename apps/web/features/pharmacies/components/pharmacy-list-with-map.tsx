"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { env } from "@/env"
import { sessionOptions } from "@/features/auth/api/session.hooks"
import { useNearestPharmaciesQuery } from "@/features/pharmacies/api/nearest.hooks"
import type { Pharmacy } from "@/features/pharmacies/api/pharmacies.hooks"
import { PharmacyMap } from "@/features/pharmacies/components/pharmacy-map"
import { persistUserLocationIfConsented, requestUserLocation } from "@/features/pharmacies/lib/geolocation"
import {
	fetchDrivingRoute,
	fetchTravelDurationsFromOrigin,
	mapWithConcurrency,
	type LngLat,
} from "@/features/pharmacies/lib/mapbox-routing"
import { fetchUser, type MeUser } from "@/features/users/api/users.api"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Spinner } from "@/core/components/ui/spinner"
import { useToast } from "@/core/components/ui/use-toast"

const TOP_K_ROUTES = 8
const ROUTE_CONCURRENCY = 4
const EMPTY_PHARMACIES: Pharmacy[] = []

function formatDuration(sec: number): string {
	if (!Number.isFinite(sec) || sec === Number.POSITIVE_INFINITY) return "—"
	const m = Math.max(1, Math.round(sec / 60))
	if (m < 60) return `${m} min`
	const h = Math.floor(m / 60)
	const rm = m % 60
	return `${h} h ${rm} min`
}

function formatDistanceKm(meters: number): string {
	if (!Number.isFinite(meters)) return "—"
	const km = meters / 1000
	return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`
}

function toLngLat(p: Pharmacy): LngLat | null {
	const lat = p.latitude
	const lng = p.longitude
	if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
		return null
	}
	return { lng, lat }
}

type RouteMode = "nearest" | "all"

export function PharmacyListWithMap() {
	const { toast } = useToast()
	const queryClient = useQueryClient()
	const googleMapsApiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

	const { data: session } = useQuery(sessionOptions)
	const userId = session?.user?.id ? String(session.user.id) : null

	const { data: profile } = useQuery({
		queryKey: ["user-profile", userId],
		queryFn: async () => {
			const u = await fetchUser(userId!)
			return u as MeUser
		},
		enabled: Boolean(userId),
		staleTime: 60_000,
	})

	const [userCoords, setUserCoords] = useState<LngLat | null>(null)
	const [manualLat, setManualLat] = useState("14.5376")
	const [manualLng, setManualLng] = useState("121.0709")
	const [saveLocationConsent, setSaveLocationConsent] = useState(false)
	const [geoBusy, setGeoBusy] = useState(false)
	const [routeMode, setRouteMode] = useState<RouteMode>("nearest")
	const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null)
	const [durationByPharmacyId, setDurationByPharmacyId] = useState<Record<string, number>>({})
	const [routeByPharmacyId, setRouteByPharmacyId] = useState<
		Record<string, { geometry: { type: "LineString"; coordinates: [number, number][] }; durationSec: number; distanceM: number }>
	>({})
	const [matrixBusy, setMatrixBusy] = useState(false)
	const [routesBusy, setRoutesBusy] = useState(false)
	const [routeError, setRouteError] = useState<string | null>(null)
	const [mapsUnavailable, setMapsUnavailable] = useState<string | null>(null)

	const prevPrimaryRef = useRef<string | null>(null)

	const { data: pharmacies = EMPTY_PHARMACIES, isLoading: pharmaciesLoading } = useNearestPharmaciesQuery({
		lat: userCoords?.lat ?? null,
		lng: userCoords?.lng ?? null,
		radiusKm: 50,
		limit: 25,
		enabled: Boolean(userCoords),
	})

	const topK = useMemo(() => {
		const out: Pharmacy[] = []
		for (const p of pharmacies) {
			if (toLngLat(p)) out.push(p)
			if (out.length >= TOP_K_ROUTES) break
		}
		return out
	}, [pharmacies])

	const primaryPharmacyId = useMemo(() => {
		if (topK.length === 0) return null
		if (Object.keys(durationByPharmacyId).length === 0) return topK[0]!.id
		let bestId = topK[0]!.id
		let bestT = durationByPharmacyId[bestId] ?? Number.POSITIVE_INFINITY
		for (const p of topK) {
			const t = durationByPharmacyId[p.id] ?? Number.POSITIVE_INFINITY
			if (t < bestT) {
				bestT = t
				bestId = p.id
			}
		}
		return bestId
	}, [topK, durationByPharmacyId])

	useEffect(() => {
		if (!primaryPharmacyId) return
		if (primaryPharmacyId !== prevPrimaryRef.current) {
			prevPrimaryRef.current = primaryPharmacyId
			setSelectedPharmacyId(primaryPharmacyId)
		}
	}, [primaryPharmacyId])

	// Matrix: rank top-K by driving duration when token is available.
	useEffect(() => {
		if (!googleMapsApiKey || !userCoords || topK.length === 0 || mapsUnavailable) {
			setDurationByPharmacyId({})
			return
		}
		let cancelled = false
		;(async () => {
			setMatrixBusy(true)
			setRouteError(null)
			try {
				const dests = topK.map(p => toLngLat(p)!).filter(Boolean)
				const durs = await fetchTravelDurationsFromOrigin(googleMapsApiKey, userCoords, dests)
				if (cancelled) return
				const next: Record<string, number> = {}
				topK.forEach((p, i) => {
					next[p.id] = durs[i] ?? Number.POSITIVE_INFINITY
				})
				setDurationByPharmacyId(next)
			} catch (e) {
				if (!cancelled) {
					setDurationByPharmacyId({})
					setRouteError(e instanceof Error ? e.message : "Could not rank pharmacies by travel time.")
				}
			} finally {
				if (!cancelled) setMatrixBusy(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [googleMapsApiKey, userCoords, topK, mapsUnavailable])

	// "All routes" — fetch once per top-K set / user / token (not on each marker selection).
	useEffect(() => {
		if (!googleMapsApiKey || !userCoords || routeMode !== "all" || topK.length === 0 || mapsUnavailable) return
		let cancelled = false
		;(async () => {
			setRoutesBusy(true)
			setRouteError(null)
			try {
				const rows = await mapWithConcurrency(topK, ROUTE_CONCURRENCY, async ph => {
					const dest = toLngLat(ph)
					if (!dest) return null
					const r = await fetchDrivingRoute(googleMapsApiKey, userCoords, dest)
					return { id: ph.id, r }
				})
				if (cancelled) return
				setRouteByPharmacyId(prev => {
					const n = { ...prev }
					for (const row of rows) {
						if (row?.id && row.r) n[row.id] = row.r
					}
					return n
				})
			} catch (e) {
				if (!cancelled) {
					setRouteError(e instanceof Error ? e.message : "Could not load driving routes.")
				}
			} finally {
				if (!cancelled) setRoutesBusy(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [googleMapsApiKey, userCoords, routeMode, topK, mapsUnavailable])

	// "Nearest only" — single route for the selected pharmacy.
	useEffect(() => {
		if (!googleMapsApiKey || !userCoords || routeMode !== "nearest" || !selectedPharmacyId || mapsUnavailable) return
		let cancelled = false
		;(async () => {
			setRoutesBusy(true)
			setRouteError(null)
			try {
				const p = topK.find(x => x.id === selectedPharmacyId) ?? pharmacies.find(x => x.id === selectedPharmacyId)
				const dest = p ? toLngLat(p) : null
				if (!dest) return
				const r = await fetchDrivingRoute(googleMapsApiKey, userCoords, dest)
				if (cancelled) return
				setRouteByPharmacyId({ [selectedPharmacyId]: r })
			} catch (e) {
				if (!cancelled) {
					setRouteError(e instanceof Error ? e.message : "Could not load driving routes.")
				}
			} finally {
				if (!cancelled) setRoutesBusy(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [googleMapsApiKey, userCoords, routeMode, selectedPharmacyId, topK, pharmacies, mapsUnavailable])

	const markers = useMemo(() => {
		return pharmacies
			.map(p => {
				const ll = toLngLat(p)
				if (!ll) return null
				return { id: p.id, lat: ll.lat, lng: ll.lng, name: p.name }
			})
			.filter(Boolean) as { id: string; lat: number; lng: number; name: string }[]
	}, [pharmacies])

	const routesForMap = useMemo(() => {
		if (!selectedPharmacyId) return []
		if (routeMode === "nearest") {
			const r = routeByPharmacyId[selectedPharmacyId]
			if (!r) return []
			return [{ pharmacyId: selectedPharmacyId, geometry: r.geometry, muted: false }]
		}
		return topK
			.map(p => {
				const r = routeByPharmacyId[p.id]
				if (!r) return null
				return {
					pharmacyId: p.id,
					geometry: r.geometry,
					muted: p.id !== selectedPharmacyId,
				}
			})
			.filter(Boolean) as { pharmacyId: string; geometry: { type: "LineString"; coordinates: [number, number][] }; muted: boolean }[]
	}, [routeByPharmacyId, routeMode, selectedPharmacyId, topK])

	async function onUseMyLocation() {
		setGeoBusy(true)
		setRouteError(null)
		try {
			const g = await requestUserLocation()
			setUserCoords({ lng: g.lng, lat: g.lat })
			if (saveLocationConsent && userId) {
				await persistUserLocationIfConsented({ ...g, consent: true })
				await queryClient.invalidateQueries({ queryKey: ["user-profile", userId] })
				toast({ title: "Location saved", description: "We stored your coordinates for future visits." })
			}
		} catch (e) {
			toast({
				title: "Location unavailable",
				description: e instanceof Error ? e.message : "Allow location or enter coordinates manually.",
				variant: "destructive",
			})
		} finally {
			setGeoBusy(false)
		}
	}

	function onApplyManual() {
		const lat = Number.parseFloat(manualLat)
		const lng = Number.parseFloat(manualLng)
		if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			toast({
				title: "Invalid coordinates",
				description: "Enter latitude (-90…90) and longitude (-180…180).",
				variant: "destructive",
			})
			return
		}
		setUserCoords({ lat, lng })
	}

	// Optional: seed from stored profile location (read-only hint; user still confirms via map / "Use my location").
	useEffect(() => {
		if (userCoords) return
		const lat = profile?.latitude
		const lng = profile?.longitude
		if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
			setManualLat(String(lat))
			setManualLng(String(lng))
		}
	}, [profile?.latitude, profile?.longitude, userCoords])

	const tokenMissing = !googleMapsApiKey?.trim()

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Find nearest pharmacy</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					We show your position, rank nearby pharmacies, and draw driving routes with Mapbox. Toggle &quot;All
					routes&quot; to compare paths to the top locations.
				</p>
			</div>

			{tokenMissing && (
				<Card className="border-amber-500/40 bg-amber-500/5">
					<CardHeader>
						<CardTitle className="text-base">Google Maps key required</CardTitle>
						<CardDescription>
							Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your
							environment to enable maps and routing.
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Your location</CardTitle>
					<CardDescription>Use GPS or enter coordinates (e.g. Taguig: 14.5376, 121.0709).</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Button type="button" onClick={() => void onUseMyLocation()} disabled={geoBusy}>
							{geoBusy && <Spinner className="mr-2 size-4" />}
							Use my location
						</Button>
						{userId ? (
							<label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
								<Checkbox checked={saveLocationConsent} onCheckedChange={v => setSaveLocationConsent(Boolean(v))} />
								Save to my account (opt-in)
							</label>
						) : null}
					</div>
					<div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
						<div className="grid flex-1 gap-2">
							<Label htmlFor="manual-lat">Latitude</Label>
							<Input id="manual-lat" value={manualLat} onChange={e => setManualLat(e.target.value)} />
						</div>
						<div className="grid flex-1 gap-2">
							<Label htmlFor="manual-lng">Longitude</Label>
							<Input id="manual-lng" value={manualLng} onChange={e => setManualLng(e.target.value)} />
						</div>
						<Button type="button" variant="secondary" onClick={onApplyManual}>
							Apply
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-wrap items-center gap-2">
				<span className="text-muted-foreground text-sm">Routes:</span>
				<Button
					type="button"
					size="sm"
					variant={routeMode === "nearest" ? "default" : "outline"}
					onClick={() => setRouteMode("nearest")}
				>
					Nearest only
				</Button>
				<Button
					type="button"
					size="sm"
					variant={routeMode === "all" ? "default" : "outline"}
					onClick={() => setRouteMode("all")}
				>
					All routes (top {TOP_K_ROUTES})
				</Button>
				{(matrixBusy || routesBusy) && (
					<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
						<Spinner className="size-4" /> Updating routes…
					</span>
				)}
			</div>

			{routeError ? <p className="text-destructive text-sm">{routeError}</p> : null}

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<Card className="min-h-[320px]">
					<CardHeader>
						<CardTitle className="text-base">Pharmacies</CardTitle>
						<CardDescription>
							{pharmaciesLoading ? "Loading…" : `${pharmacies.length} within search radius`}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex max-h-[min(70vh,560px)] flex-col gap-2 overflow-y-auto pr-1">
						{!userCoords ? (
							<p className="text-muted-foreground text-sm">Set your location to list nearby pharmacies.</p>
						) : pharmacies.length === 0 ? (
							<p className="text-muted-foreground text-sm">No pharmacies found near this point.</p>
						) : (
							pharmacies.map(p => {
								const ll = toLngLat(p)
								const active = p.id === selectedPharmacyId
								const primary = p.id === primaryPharmacyId
								const dur = durationByPharmacyId[p.id]
								const route = routeByPharmacyId[p.id]
								return (
									<button
										key={p.id}
										type="button"
										onClick={() => setSelectedPharmacyId(p.id)}
										className={[
											"rounded-lg border p-3 text-left text-sm transition-colors",
											active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
										].join(" ")}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="truncate font-medium">{p.name}</p>
												<p className="text-muted-foreground truncate text-xs">{p.address}</p>
											</div>
											{primary ? (
												<span className="bg-primary text-primary-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
													Nearest
												</span>
											) : null}
										</div>
										<div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
											{typeof p.distance === "number" && Number.isFinite(p.distance) ? (
												<span>{p.distance.toFixed(1)} km (straight line)</span>
											) : null}
											{ll && typeof dur === "number" && Number.isFinite(dur) ? (
												<span>~{formatDuration(dur)} drive</span>
											) : null}
											{route ? <span>{formatDistanceKm(route.distanceM)} · {formatDuration(route.durationSec)}</span> : null}
										</div>
									</button>
								)
							})
						)}
					</CardContent>
				</Card>

				{userCoords && !tokenMissing ? (
					<PharmacyMap
						googleMapsApiKey={googleMapsApiKey}
						user={userCoords}
						pharmacies={markers}
						selectedPharmacyId={selectedPharmacyId}
						primaryPharmacyId={primaryPharmacyId}
						routes={routesForMap}
						onPharmacySelect={id => setSelectedPharmacyId(id)}
						onMapUnavailable={message => {
							setMapsUnavailable(message)
							setRouteError(message)
						}}
					/>
				) : (
					<div className="text-muted-foreground flex min-h-[320px] items-center justify-center rounded-xl border border-dashed text-sm">
						{!userCoords ? "Map appears after you set a location." : "Configure Google Maps to see the map."}
					</div>
				)}
			</div>
		</div>
	)
}
