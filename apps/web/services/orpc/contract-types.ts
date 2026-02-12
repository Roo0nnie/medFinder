import type { InferContractRouterInputs, InferContractRouterOutputs } from "@orpc/contract"

import { type v1Contract } from "@repo/contracts"

export type V1Inputs = InferContractRouterInputs<typeof v1Contract>
export type V1Outputs = InferContractRouterOutputs<typeof v1Contract>

/** Extract element type from an array-returning procedure output (e.g. list). */
export type ArrayItem<T> = T extends readonly (infer E)[] ? E : never

/** Transform Date fields to string fields for serialized API responses. */
export type SerializeDates<T, K extends keyof T> = Omit<T, K> & { [P in K]: string }

/** Convenience helper for array-returning procedures with serialized dates. */
export type SerializedArrayItem<T, K extends keyof ArrayItem<T>> = SerializeDates<ArrayItem<T>, K>
