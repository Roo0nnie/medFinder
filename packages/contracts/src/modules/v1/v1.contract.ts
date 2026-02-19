import { oc } from "@orpc/contract"

import { healthContract } from "./health/health.contract.js"
import { pharmaciesContract } from "./pharmacies/pharmacies.contract.js"
import { productsContract } from "./products/products.contract.js"
import { inventoryContract } from "./inventory/inventory.contract.js"
import { reservationsContract } from "./reservations/reservations.contract.js"

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
	})
)

export type V1Contract = typeof v1Contract
