import type { InferContractRouterInputs, InferContractRouterOutputs } from "@orpc/contract"

import { type v1Contract } from "@repo/contracts"

export type V1Inputs = InferContractRouterInputs<typeof v1Contract>
export type V1Outputs = InferContractRouterOutputs<typeof v1Contract>

/** Extract element type from an array-returning procedure output (e.g. list). */
export type ArrayItem<T> = T extends readonly (infer E)[] ? E : never

/** List item as received from the API (dates serialized as strings). */
export type TodoListItem = Omit<
	ArrayItem<V1Outputs["example"]["todo"]["list"]>,
	"createdAt" | "updatedAt"
> & { createdAt: string; updatedAt: string }
