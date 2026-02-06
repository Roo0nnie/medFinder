/**
 * @repo/contracts
 * Shared oRPC contracts for type-safe API communication
 */

// Export schemas
export * from "./modules/v1/examples/todos.schema.js"
export * from "./modules/v1/health/health.schema.js"

// Export contracts
export * from "./modules/v1/examples/todos.contract.js"
export * from "./modules/v1/health/health.contract.js"

// Export main contract router
export { contract, type Contract } from "./contracts.js"

// Export utilities
export * from "./utils/transform.js"

// Re-export useful types from @orpc packages for convenience
export type { ContractRouter } from "@orpc/contract"
