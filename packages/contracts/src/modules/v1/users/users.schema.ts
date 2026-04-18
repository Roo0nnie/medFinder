import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const userRoleSchema = z.enum(["admin", "owner", "staff", "customer"])
export type UserRole = z.infer<typeof userRoleSchema>

const baseUserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	emailVerified: z.boolean().default(false),
	image: z.string().nullable().optional(),
	profileImageUrl: z.string().nullable().optional(),
	firstName: z.string().nullable().optional(),
	lastName: z.string(),
	middleName: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	role: userRoleSchema,
	createdAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.union([z.date(), z.string()])
		.transform(val => (typeof val === "string" ? new Date(val) : val)),
})

export const UserSchema = baseUserSchema

export const CreateUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).optional(),
	firstName: z.string().optional(),
	lastName: z.string().min(1),
	middleName: z.string().optional(),
	role: userRoleSchema.default("customer"),
})

export const UpdateUserSchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	middleName: z.string().optional(),
	role: userRoleSchema.optional(),
	email: z.string().email().optional(),
	profileImageUrl: z.string().optional(),
	phone: z.string().optional(),
})

export const UserIdSchema = z.object({
	id: z.string(),
})

// ============================================================================
// TYPES
// ============================================================================

export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UserIdInput = z.infer<typeof UserIdSchema>
