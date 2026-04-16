import type { LandingPharmacy } from "./types"

/**
 * Static fallback data used when the API is unavailable.
 * Keep this small and representative; the real catalog comes from `useLandingCatalog()`.
 */
export const landingPharmacies: LandingPharmacy[] = [
	{
		id: "demo-pharmacy-1",
		name: "MedFinder Community Pharmacy",
		address: "123 Main Street",
		city: "Cebu City",
		municipality: "Cebu",
		ownerId: "demo-owner-1",
		whatIsThis: "Fast pickup and delivery",
		description: "A demo pharmacy used as a fallback when the backend API is not configured.",
		phone: "+63 912 345 6789",
		email: "hello@medfinder.example",
		website: "https://medfinder.example",
		latitude: 10.3157,
		longitude: 123.8854,
		rating: 4.6,
		operatingHours: "Mon–Sat 8:00–18:00",
	},
	{
		id: "demo-pharmacy-2",
		name: "CityCare Pharmacy",
		address: "45 Rizal Avenue",
		city: "Mandaue",
		municipality: "Cebu",
		ownerId: "demo-owner-2",
		whatIsThis: "Trusted everyday medicines",
		description: "Demo storefront data (API fallback).",
		phone: "+63 917 000 0000",
		latitude: 10.3232,
		longitude: 123.9429,
		rating: 4.3,
		operatingHours: "Daily 9:00–19:00",
	},
]
