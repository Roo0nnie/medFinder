import { createZodDto } from "nestjs-zod"
import { z } from "zod"

// ============================================================================
// SCHEMAS
// ============================================================================

export const AuthSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string().optional(),
})

export type Auth = z.infer<typeof AuthSchema>

// ============================================================================
// DTOs
// ============================================================================

export class AuthDto extends createZodDto(AuthSchema) {}
