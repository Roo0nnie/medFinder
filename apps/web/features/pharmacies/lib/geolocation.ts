/**
 * Browser geolocation helpers for the pharmacy finder map.
 */

import { saveMyUserLocation } from "@/features/users/api/users.api"

export type GeolocationResult = {
	lat: number
	lng: number
	accuracyM?: number | null
}

export function requestUserLocation(options?: PositionOptions): Promise<GeolocationResult> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			reject(new Error("Geolocation is not supported in this environment."))
			return
		}
		navigator.geolocation.getCurrentPosition(
			pos => {
				resolve({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
				})
			},
			err => {
				reject(err instanceof Error ? err : new Error("Could not read your location."))
			},
			{
				enableHighAccuracy: true,
				timeout: 15_000,
				maximumAge: 0,
				...options,
			}
		)
	})
}

/**
 * Persist coordinates to the authenticated user when they opted in (`consent: true`).
 */
export async function persistUserLocationIfConsented(
	result: GeolocationResult & { consent: boolean }
): Promise<void> {
	if (!result.consent) return
	await saveMyUserLocation({
		latitude: result.lat,
		longitude: result.lng,
		accuracy: result.accuracyM ?? null,
		consent: true,
	})
}
