import { createZodDto } from "nestjs-zod"

import { AuthSchema } from "./auth.schema.js"

export class AuthDto extends createZodDto(AuthSchema) {}
