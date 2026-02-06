import { oc } from "@orpc/contract"

import { todoContract } from "./modules/v1/examples/todos.contract.js"
import { healthContract } from "./modules/v1/health/health.contract.js"

/**
 * Main contract router
 * Combines all API contracts
 */
export const contract = oc.router({
	health: healthContract,
	todo: todoContract,
})

/**
 * Export contract type for type inference
 */
export type Contract = typeof contract
