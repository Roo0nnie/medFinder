/**
 * Central contract registry
 * Re-exports version routers
 */

// V1 contracts (routers)
export { v1Contract, type V1Contract } from "./modules/v1/v1.contract.js"

// User schemas and types
export * from "./modules/v1/users/users.schema.js"

// Staff schemas and types
export * from "./modules/v1/staff/staff.schema.js"

// Analytics schemas and types
export * from "./modules/v1/analytics/analytics.schema.js"

// Admin schemas and types
export * from "./modules/v1/admin/admin.schema.js"

// Future versions:
// export { v2Contract, type V2Contract } from "./modules/v2/v2.contract.js"
// export const v2 = { ... }
// export type { Todo as V2Todo, ... } from "./modules/v2/..."
