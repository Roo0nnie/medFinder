"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export type PharmacyMapMarker = {
	id: string
	lat: number
	lng: number
	name: string
}

export type PharmacyRouteLayer = {
	pharmacyId: string
	geometry: { type: "LineString"; coordinates: [number, number][] }
	muted: boolean
}

type PharmacyMapProps = {
	googleMapsApiKey: string
	user: { lng: number; lat: number }
	pharmacies: PharmacyMapMarker[]
	selectedPharmacyId: string | null
	primaryPharmacyId: string | null
	routes: PharmacyRouteLayer[]
	onPharmacySelect?: (pharmacyId: string) => void
	onMapUnavailable?: (message: string | null) => void
}

function assertApiKey(apiKey: string): void {
	if (!apiKey?.trim()) throw new Error("Google Maps API key is missing.")
}

let loaderPromise: Promise<void> | null = null
let loadedKey: string | null = null

async function ensureGoogleLoaded(apiKey: string): Promise<void> {
	assertApiKey(apiKey)
	const k = apiKey.trim()

	if (loadedKey !== k) {
		loadedKey = k
		loaderPromise = new Promise<void>((resolve, reject) => {
			if ((globalThis as any).google?.maps) return resolve()

			const id = "google-maps-js"
			const existing = document.getElementById(id) as HTMLScriptElement | null
			if (existing) {
				existing.addEventListener("load", () => resolve())
				existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps JS API.")))
				return
			}

			const previousAuthFailure = (globalThis as any).gm_authFailure
			;(globalThis as any).gm_authFailure = () => {
				reject(new Error("Google Maps is unavailable for this API key."))
				if (typeof previousAuthFailure === "function") previousAuthFailure()
			}

			const script = document.createElement("script")
			script.id = id
			script.async = true
			script.defer = true
			script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(k)}&v=weekly`
			script.addEventListener("load", () => resolve())
			script.addEventListener("error", () => reject(new Error("Failed to load Google Maps JS API.")))
			document.head.appendChild(script)
		})
	}

	await loaderPromise
	if (!(globalThis as any).google?.maps) throw new Error("Google Maps JS API failed to load.")
}

export function PharmacyMap({
	googleMapsApiKey,
	user,
	pharmacies,
	selectedPharmacyId,
	primaryPharmacyId,
	routes,
	onPharmacySelect,
	onMapUnavailable,
}: PharmacyMapProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<any>(null)
	const userMarkerRef = useRef<any>(null)
	const pharmacyMarkersRef = useRef<Map<string, any>>(new Map())
	const routePolylinesRef = useRef<Map<string, any>>(new Map())
	const directionsServiceRef = useRef<any>(null)
	const directionsRendererRef = useRef<any>(null)
	const [mapReady, setMapReady] = useState(false)
	const [mapUnavailable, setMapUnavailable] = useState<string | null>(null)

	const initialCenter = useMemo(() => ({ lat: user.lat, lng: user.lng }), [user.lat, user.lng])
	const osmEmbedUrl = useMemo(() => {
		const delta = 0.02
		const left = Math.max(-180, initialCenter.lng - delta)
		const right = Math.min(180, initialCenter.lng + delta)
		const top = Math.min(90, initialCenter.lat + delta)
		const bottom = Math.max(-90, initialCenter.lat - delta)
		const bbox = `${left},${bottom},${right},${top}`
		return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(
			`${initialCenter.lat},${initialCenter.lng}`
		)}`
	}, [initialCenter.lat, initialCenter.lng])

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				await ensureGoogleLoaded(googleMapsApiKey)
				if (cancelled) return
				if (!containerRef.current) return

				if (!mapRef.current) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const googleAny: any = (globalThis as any).google
					mapRef.current = new googleAny.maps.Map(containerRef.current, {
						center: initialCenter,
						zoom: 12,
						mapTypeControl: false,
						streetViewControl: false,
						fullscreenControl: false,
					})
				}

				if (!directionsServiceRef.current) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const googleAny: any = (globalThis as any).google
					directionsServiceRef.current = new googleAny.maps.DirectionsService()
				}
				if (!directionsRendererRef.current) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const googleAny: any = (globalThis as any).google
					directionsRendererRef.current = new googleAny.maps.DirectionsRenderer({
						suppressMarkers: true,
						preserveViewport: true,
						polylineOptions: {
							strokeColor: "#0f766e",
							strokeOpacity: 0.98,
							strokeWeight: 7,
							zIndex: 30,
						},
					})
					directionsRendererRef.current.setMap(mapRef.current)
				}

				setMapReady(true)
				setMapUnavailable(null)
				onMapUnavailable?.(null)
			} catch {
				const message = "Google Maps is unavailable for this API key."
				setMapUnavailable(message)
				onMapUnavailable?.(message)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [googleMapsApiKey, initialCenter, onMapUnavailable])

	useEffect(() => {
		const map = mapRef.current
		if (!mapReady || !map) return

		// User marker
		if (!userMarkerRef.current) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const googleAny: any = (globalThis as any).google
			userMarkerRef.current = new googleAny.maps.Marker({
				map,
				position: initialCenter,
				title: "Your location",
				icon: {
					path: googleAny.maps.SymbolPath.CIRCLE,
					fillColor: "#14b8a6",
					fillOpacity: 1,
					strokeColor: "#ffffff",
					strokeWeight: 2,
					scale: 9,
				},
				label: { text: "You", color: "#0f172a", fontWeight: "700" },
			})
		} else {
			userMarkerRef.current.setPosition(initialCenter)
		}
	}, [mapReady, initialCenter])

	useEffect(() => {
		const map = mapRef.current
		if (!mapReady || !map) return

		// Upsert pharmacy markers
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const googleAny: any = (globalThis as any).google
		const nextIds = new Set(pharmacies.map(p => p.id))
		for (const [id, marker] of pharmacyMarkersRef.current.entries()) {
			if (!nextIds.has(id)) {
				marker.setMap(null)
				pharmacyMarkersRef.current.delete(id)
			}
		}

		for (const p of pharmacies) {
			let marker = pharmacyMarkersRef.current.get(p.id)
			if (!marker) {
				marker = new googleAny.maps.Marker({
					map,
					position: { lat: p.lat, lng: p.lng },
					title: p.name,
				})
				marker.addListener("click", () => onPharmacySelect?.(p.id))
				pharmacyMarkersRef.current.set(p.id, marker)
			} else {
				marker.setPosition({ lat: p.lat, lng: p.lng })
				marker.setTitle(p.name)
			}

			const isSelected = p.id === selectedPharmacyId
			const isPrimary = p.id === primaryPharmacyId
			marker.setIcon(
				isSelected
					? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
					: isPrimary
						? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
						: undefined
			)
		}
	}, [mapReady, pharmacies, onPharmacySelect, primaryPharmacyId, selectedPharmacyId])

	useEffect(() => {
		const map = mapRef.current
		if (!mapReady || !map) return
		if (!directionsServiceRef.current || !directionsRendererRef.current) return

		// If we already have polyline routes provided by parent, prefer those.
		// Otherwise, render a single driving route using Google Directions.
		if (routes.length > 0) {
			directionsRendererRef.current.setDirections({ routes: [] })
			return
		}

		const targetId = selectedPharmacyId ?? primaryPharmacyId
		const dest = targetId ? pharmacies.find(p => p.id === targetId) : null
		if (!dest) {
			directionsRendererRef.current.setDirections({ routes: [] })
			return
		}

		directionsServiceRef.current.route(
			{
				origin: { lat: user.lat, lng: user.lng },
				destination: { lat: dest.lat, lng: dest.lng },
				travelMode: (globalThis as any).google.maps.TravelMode.DRIVING,
			},
			(result: any, status: any) => {
				if (status === "OK" && result) {
					directionsRendererRef.current.setDirections(result)
				} else {
					// keep map usable even if routing fails
					// eslint-disable-next-line no-console
					console.error("Directions request failed:", status)
				}
			}
		)
	}, [mapReady, pharmacies, primaryPharmacyId, routes.length, selectedPharmacyId, user.lat, user.lng])

	useEffect(() => {
		const map = mapRef.current
		if (!mapReady || !map) return

		// Upsert polylines
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const googleAny: any = (globalThis as any).google
		const nextIds = new Set(routes.map(r => r.pharmacyId))
		for (const [id, poly] of routePolylinesRef.current.entries()) {
			if (!nextIds.has(id)) {
				poly.setMap(null)
				routePolylinesRef.current.delete(id)
			}
		}

		for (const r of routes) {
			const path = r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
			let poly = routePolylinesRef.current.get(r.pharmacyId)
			if (!poly) {
				poly = new googleAny.maps.Polyline({
					map,
					path,
					strokeColor: r.muted ? "#64748b" : "#0f766e",
					strokeOpacity: r.muted ? 0.45 : 0.98,
					strokeWeight: r.muted ? 4 : 7,
					zIndex: r.muted ? 2 : 20,
				})
				routePolylinesRef.current.set(r.pharmacyId, poly)
			} else {
				poly.setPath(path)
				poly.setOptions({
					strokeColor: r.muted ? "#64748b" : "#0f766e",
					strokeOpacity: r.muted ? 0.45 : 0.98,
					strokeWeight: r.muted ? 4 : 7,
					zIndex: r.muted ? 2 : 20,
				})
			}
		}

		// Fit bounds to user + pharmacies + route geometry.
		const bounds = new googleAny.maps.LatLngBounds()
		bounds.extend(initialCenter)
		for (const p of pharmacies) bounds.extend({ lat: p.lat, lng: p.lng })
		for (const r of routes) for (const [lng, lat] of r.geometry.coordinates) bounds.extend({ lat, lng })
		map.fitBounds(bounds, 72)
	}, [mapReady, initialCenter, pharmacies, routes])

	if (mapUnavailable) {
		return (
			<div className="bg-card text-card-foreground flex h-[min(70vh,560px)] w-full min-h-[320px] flex-col overflow-hidden rounded-xl border">
				<div className="border-b px-4 py-3">
					<p className="font-medium">Map unavailable</p>
					<p className="text-muted-foreground text-sm">
						{mapUnavailable} Showing an OpenStreetMap preview instead.
					</p>
				</div>
				<iframe
					title="Pharmacy map preview"
					src={osmEmbedUrl}
					className="h-full w-full"
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</div>
		)
	}

	return (
		<div className="relative h-[min(70vh,560px)] w-full min-h-[320px] overflow-hidden rounded-xl border">
			<div ref={containerRef} className="h-full w-full" />
		</div>
	)
}
