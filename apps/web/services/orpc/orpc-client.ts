import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import type { JsonifiedClient } from "@orpc/openapi-client"

import { type Contract } from "@repo/contracts"

import { createOrpcLink } from "./orpc-link"

export type OrpcClient = JsonifiedClient<ContractRouterClient<Contract>>

declare global {
	var $orpc: OrpcClient | undefined
}

const link = createOrpcLink()

/**
 * Type-safe oRPC client for frontend API calls
 * Uses OpenAPI Link to communicate with the NestJS backend via HTTP
 */
export const orpc: OrpcClient = globalThis.$orpc ?? createORPCClient<OrpcClient>(link)

/**
 * Export contract type for use in components
 */
export type { Contract }

/**
 * Type inference helpers for oRPC procedures
 */

/**
 * Infer the output type of an oRPC procedure
 * @example type TodoList = InferProcedureOutput<typeof orpc.todo.list>
 */
export type InferProcedureOutput<T extends (...args: unknown[]) => unknown> = Awaited<ReturnType<T>>

/**
 * Infer the input type of an oRPC procedure
 * @example type CreateTodoInput = InferProcedureInput<typeof orpc.todo.create>
 */
export type InferProcedureInput<T extends (...args: unknown[]) => unknown> = Parameters<T>[0]

/**
 * Infer a single item from an array-returning oRPC procedure
 * @example type Todo = InferArrayItem<typeof orpc.todo.list>
 */
export type InferArrayItem<T extends (...args: unknown[]) => unknown> =
	Awaited<ReturnType<T>> extends Array<infer Item> ? Item : never
