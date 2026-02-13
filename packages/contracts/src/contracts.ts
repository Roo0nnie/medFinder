/**
 * Central contract registry
 * Re-exports version routers
 */

// V1 contracts (routers)
export { v1Contract, type V1Contract } from "./modules/v1/v1.contract.js"

// Todo input types for backend handlers
export type {
	CreateTodoInput,
	TodoIdInput,
	UpdateTodoRequest,
} from "./modules/v1/examples/todos/todos.schema.js"

// Future versions:
// export { v2Contract, type V2Contract } from "./modules/v2/v2.contract.js"
// export const v2 = { ... }
// export type { Todo as V2Todo, ... } from "./modules/v2/..."
