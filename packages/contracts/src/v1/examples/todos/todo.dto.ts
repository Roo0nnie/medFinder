import { createZodDto } from "nestjs-zod"

import { CreateTodoSchema, TodoSchema, UpdateTodoSchema } from "./todo.schema.js"

export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}

export class UpdateTodoDto extends createZodDto(UpdateTodoSchema) {}

export class TodoDto extends createZodDto(TodoSchema) {}
