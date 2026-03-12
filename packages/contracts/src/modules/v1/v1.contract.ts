import { oc } from "@orpc/contract"

import { healthContract } from "./health/health.contract.js"
import { pharmaciesContract } from "./pharmacies/pharmacies.contract.js"
import { productsContract } from "./products/products.contract.js"
import { inventoryContract } from "./inventory/inventory.contract.js"
import { reservationsContract } from "./reservations/reservations.contract.js"
import { reviewsContract } from "./reviews/reviews.contract.js"
import { analyticsContract } from "./analytics/analytics.contract.js"
import { deletionRequestsContract } from "./deletion-requests/deletion-requests.contract.js"
import { staffContract } from "./staff/staff.contract.js"

/**
 * V1 contract router (versioned paths: /v1/health, etc)
 * Assembles all v1 feature contracts and applies the /v1 prefix
 */
export const v1Contract = oc.prefix("/v1").router(
	oc.router({
		health: healthContract,
		pharmacies: pharmaciesContract,
		products: productsContract,
		inventory: inventoryContract,
		reservations: reservationsContract,
		reviews: reviewsContract,
		analytics: analyticsContract,
		deletionRequests: deletionRequestsContract,
		staff: staffContract,
	})
)

export type V1Contract = typeof v1Contract
