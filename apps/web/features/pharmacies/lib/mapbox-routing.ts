/**
 * Google Maps (JS API) routing + matrix (browser-side calls).
 */

export type LngLat = { lng: number; lat: number }

export type DrivingRouteResult = {
	geometry: { type: "LineString"; coordinates: [number, number][] }
	durationSec: number
	distanceM: number
}

let loaderPromise: Promise<void> | null = null
let loadedKey: string | null = null

function assertApiKey(apiKey: string): void {
	if (!apiKey?.trim()) throw new Error("Google Maps API key is not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).")
}

async function ensureGoogleLoaded(apiKey: string): Promise<void> {
	assertApiKey(apiKey)

	// If the key changes (dev), re-init loader for the new key.
	if (loadedKey !== apiKey.trim()) {
		loadedKey = apiKey.trim()
		loaderPromise = new Promise<void>((resolve, reject) => {
			// If script already exists, assume it matches the currently loaded key.
			if ((globalThis as any).google?.maps) return resolve()

			const id = "google-maps-js"
			const existing = globalThis.document?.getElementById(id) as HTMLScriptElement | null
			if (existing) {
				existing.addEventListener("load", () => resolve())
				existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps JS API.")))
				return
			}

			if (!globalThis.document) return reject(new Error("Google Maps JS API can only load in the browser."))

			const script = document.createElement("script")
			script.id = id
			script.async = true
			script.defer = true
			script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(loadedKey!)}&v=weekly`
			script.addEventListener("load", () => resolve())
			script.addEventListener("error", () => reject(new Error("Failed to load Google Maps JS API.")))
			document.head.appendChild(script)
		})
	}
	await loaderPromise

	if (!(globalThis as any).google?.maps) {
		throw new Error("Google Maps JS API failed to load.")
	}
}

function toTravelMode(profile: "mapbox/driving" | "mapbox/walking"): any {
	const googleAny: any = (globalThis as any).google
	return profile === "mapbox/walking" ? googleAny.maps.TravelMode.WALKING : googleAny.maps.TravelMode.DRIVING
}

export async function fetchDrivingRoute(
	apiKey: string,
	from: LngLat,
	to: LngLat,
	profile: "mapbox/driving" | "mapbox/walking" = "mapbox/driving"
): Promise<DrivingRouteResult> {
	await ensureGoogleLoaded(apiKey)

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const googleAny: any = (globalThis as any).google
	const svc = new googleAny.maps.DirectionsService()
	const res = await svc.route({
		origin: { lat: from.lat, lng: from.lng },
		destination: { lat: to.lat, lng: to.lng },
		travelMode: toTravelMode(profile),
		provideRouteAlternatives: false,
	})

	if (!res || !Array.isArray(res.routes) || res.routes.length === 0) {
		throw new Error("No route returned from Google Directions.")
	}

	const route = res.routes[0]
	const leg = route?.legs?.[0]
	if (!route || !leg) throw new Error("No route returned from Google Directions.")

	const coords = (route.overview_path ?? []).map((p: any) => [p.lng(), p.lat()] as [number, number])
	if (coords.length === 0) throw new Error("No route geometry returned from Google Directions.")

	return {
		geometry: { type: "LineString", coordinates: coords },
		durationSec: leg.duration?.value ?? Number.POSITIVE_INFINITY,
		distanceM: leg.distance?.value ?? Number.POSITIVE_INFINITY,
	}
}

/**
 * Travel durations (seconds) from `origin` to each destination, in destination order.
 */
export async function fetchTravelDurationsFromOrigin(
	apiKey: string,
	origin: LngLat,
	destinations: LngLat[],
	profile: "mapbox/driving" | "mapbox/walking" = "mapbox/driving"
): Promise<number[]> {
	if (destinations.length === 0) return []
	await ensureGoogleLoaded(apiKey)

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const googleAny: any = (globalThis as any).google
	const svc = new googleAny.maps.DistanceMatrixService()
	const resp = await svc.getDistanceMatrix({
		origins: [{ lat: origin.lat, lng: origin.lng }],
		destinations: destinations.map(d => ({ lat: d.lat, lng: d.lng })),
		travelMode: toTravelMode(profile),
		unitSystem: googleAny.maps.UnitSystem.METRIC,
	})

	const row = resp.rows?.[0]
	const elements = row?.elements
	if (!elements || elements.length !== destinations.length) throw new Error("Unexpected Distance Matrix response.")

	return elements.map((el: any) => {
		const v = el.duration?.value as unknown
		return typeof v === "number" && Number.isFinite(v) ? v : Number.POSITIVE_INFINITY
	})
}

/**
 * Run async work with a fixed concurrency limit (pool of workers).
 */
export async function mapWithConcurrency<T, R>(
	items: readonly T[],
	concurrency: number,
	mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
	if (items.length === 0) return []
	const results: R[] = new Array(items.length)
	let cursor = 0
	const limit = Math.max(1, Math.min(concurrency, items.length))

	async function worker() {
		while (true) {
			const i = cursor++
			if (i >= items.length) break
			results[i] = await mapper(items[i]!, i)
		}
	}

	await Promise.all(Array.from({ length: limit }, () => worker()))
	return results
}
