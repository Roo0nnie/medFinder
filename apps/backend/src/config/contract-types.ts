import type { InferContractRouterInputs, InferContractRouterOutputs } from "@orpc/contract"

import { type v1Contract } from "@repo/contracts"

type V1Inputs = InferContractRouterInputs<typeof v1Contract>
type V1Outputs = InferContractRouterOutputs<typeof v1Contract>

export type CreateTodoInput = V1Inputs["example"]["todo"]["create"]
export type TodoIdInput = V1Inputs["example"]["todo"]["get"]
export type UpdateTodoRequest = V1Inputs["example"]["todo"]["update"]
export type Todo = V1Outputs["example"]["todo"]["get"]
export type HealthCheck = V1Outputs["health"]["check"]
