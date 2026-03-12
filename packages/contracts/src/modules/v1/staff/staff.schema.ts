/**
 * Staff contract schemas for input/output validation and type safety.
 */
import { z } from "zod"

export const staffSchema = z.object({
	id: z.string(),
	userId: z.string(),
	department: z.string(),
	position: z.string(),
	specialization: z.string().optional(),
	bio: z.string().optional(),
	phone: z.string().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type Staff = z.infer<typeof staffSchema>

export const staffCreateSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	department: z.string().min(1, "Department is required"),
	position: z.string().min(1, "Position is required"),
	specialization: z.string().optional(),
	bio: z.string().optional(),
	phone: z.string().optional(),
	isActive: z.boolean().default(true),
})

export type StaffCreate = z.infer<typeof staffCreateSchema>

export const staffUpdateSchema = staffCreateSchema.partial()

export type StaffUpdate = z.infer<typeof staffUpdateSchema>

export const staffListResponseSchema = z.object({
	data: z.array(staffSchema),
	count: z.number(),
	search: z.string().optional(),
	isActive: z.boolean().optional(),
})

export type StaffListResponse = z.infer<typeof staffListResponseSchema>
