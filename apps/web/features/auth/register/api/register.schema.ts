import { z } from "zod"

export const RegisterSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	email: z
		.string()
		.trim()
		.email("Please enter a valid email address")
		.transform(val => val.toLowerCase()),
	password: z.string().min(8, "Password must be at least 8 characters"),
})

export type Register = z.infer<typeof RegisterSchema>
