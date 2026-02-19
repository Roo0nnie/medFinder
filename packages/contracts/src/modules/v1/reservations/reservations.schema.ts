import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const ReservationStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed"])

const baseReservationSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	inventoryId: z.string(),
	quantity: z.number().int().positive(),
	status: ReservationStatusSchema.default("pending"),
	expiresAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val))
		.nullable()
		.optional(),
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const ReservationSchema = baseReservationSchema

export const CreateReservationSchema = z.object({
	inventoryId: z.string().min(1),
	quantity: z.number().int().positive(),
})

export const UpdateReservationSchema = z.object({
	quantity: z.number().int().positive().optional(),
	status: ReservationStatusSchema.optional(),
})

export const ReservationSearchSchema = z.object({
	customerId: z.string().optional(),
	inventoryId: z.string().optional(),
	status: ReservationStatusSchema.optional(),
	pharmacyId: z.string().optional(),
})

export const ReservationIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type Reservation = z.infer<typeof ReservationSchema>
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>
export type UpdateReservationInput = z.infer<typeof UpdateReservationSchema>
export type ReservationSearch = z.infer<typeof ReservationSearchSchema>
export type ReservationIdInput = z.infer<typeof ReservationIdSchema>
