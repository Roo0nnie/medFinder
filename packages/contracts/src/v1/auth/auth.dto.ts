import { createZodDto } from "nestjs-zod"

import { AuthSchema } from "./auth.schema"

export class AuthDto extends createZodDto(AuthSchema) {}
