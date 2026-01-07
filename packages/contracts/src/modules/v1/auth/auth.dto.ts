import { createDto, type DtoFromSchema } from "../../../utils/dto-generator.js"
import { AuthSchema } from "./auth.schema.js"

export class AuthDto extends createDto(AuthSchema, "AuthDto") {}
export type AuthDtoType = DtoFromSchema<typeof AuthSchema>
