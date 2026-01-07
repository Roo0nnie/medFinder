import { createZodDto } from "nestjs-zod"

import { ApiSuccessResponseSchema } from "../../../../common/common.schemas.js"
import { CreateTodoSchema, TodoSchema, UpdateTodoSchema } from "./todo.schema.js"

export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}

export class UpdateTodoDto extends createZodDto(UpdateTodoSchema) {}

export class TodoResponseDto extends createZodDto(ApiSuccessResponseSchema(TodoSchema)) {}

export class TodoListResponseDto extends createZodDto(
	ApiSuccessResponseSchema(TodoSchema.array())
) {}
