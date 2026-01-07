import { createZodDto } from "nestjs-zod"

import { HealthCheckSchema } from "./common.schemas.js"

export class HealthCheckDto extends createZodDto(HealthCheckSchema) {}
