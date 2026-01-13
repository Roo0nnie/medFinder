import { z } from "zod"

export const RegisterSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	name: z.string(),
})

export type Register = z.infer<typeof RegisterSchema>
