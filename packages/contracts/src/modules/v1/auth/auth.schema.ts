import { z } from "zod"

// Placeholder auth schemas - can be expanded based on your auth requirements
export const AuthSchema = z
	.object({
		id: z.string(),
		email: z.string().email(),
		name: z.string().optional(),
	})
	.meta({ id: "AuthDto" })

export type Auth = z.infer<typeof AuthSchema>
