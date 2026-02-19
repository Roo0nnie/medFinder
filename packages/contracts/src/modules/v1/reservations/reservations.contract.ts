import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	ReservationSchema,
	CreateReservationSchema,
	UpdateReservationSchema,
	ReservationSearchSchema,
	ReservationIdSchema,
} from "./reservations.schema.js"

export const reservationsContract = {
	/**
	 * List reservations
	 * GET /reservations
	 */
	list: oc
		.route({
			method: "GET",
			path: "/reservations",
			summary: "List reservations",
			description: "Retrieve reservations (customer sees own, staff/owner see pharmacy's)",
			tags: ["Reservations"],
		})
		.input(ReservationSearchSchema.partial())
		.output(z.array(ReservationSchema)),

	/**
	 * Get a single reservation by ID
	 * GET /reservations/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/reservations/{id}",
			summary: "Get reservation by ID",
			description: "Retrieve a single reservation",
			tags: ["Reservations"],
		})
		.input(ReservationIdSchema)
		.output(ReservationSchema),

	/**
	 * Create a new reservation
	 * POST /reservations
	 */
	create: oc
		.route({
			method: "POST",
			path: "/reservations",
			summary: "Create reservation",
			description: "Create a new product reservation (customer only)",
			tags: ["Reservations"],
		})
		.input(CreateReservationSchema)
		.output(ReservationSchema),

	/**
	 * Update a reservation
	 * PUT /reservations/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/reservations/{id}",
			summary: "Update reservation",
			description: "Update a reservation status or quantity",
			tags: ["Reservations"],
		})
		.input(ReservationIdSchema.extend(UpdateReservationSchema.shape))
		.output(ReservationSchema),

	/**
	 * Cancel a reservation
	 * DELETE /reservations/{id}
	 */
	cancel: oc
		.route({
			method: "DELETE",
			path: "/reservations/{id}",
			summary: "Cancel reservation",
			description: "Cancel a reservation by ID",
			tags: ["Reservations"],
		})
		.input(ReservationIdSchema)
		.output(z.object({ success: z.boolean(), id: z.string() })),

	/**
	 * Get user's reservations
	 * GET /reservations/my-reservations
	 */
	myReservations: oc
		.route({
			method: "GET",
			path: "/reservations/my-reservations",
			summary: "Get my reservations",
			description: "Retrieve all reservations for the authenticated customer",
			tags: ["Reservations"],
		})
		.output(z.array(ReservationSchema)),
}
