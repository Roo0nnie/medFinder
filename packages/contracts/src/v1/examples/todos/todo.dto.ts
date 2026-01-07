import { createDto, type DtoFromSchema } from "../../../utils/dto-generator.js"
import { CreateTodoSchema, TodoSchema, UpdateTodoSchema } from "./todo.schema.js"

export class CreateTodoDto extends createDto(CreateTodoSchema, "CreateTodoDto") {}
export type CreateTodoDtoType = DtoFromSchema<typeof CreateTodoSchema>

export class UpdateTodoDto extends createDto(UpdateTodoSchema, "UpdateTodoDto") {}
export type UpdateTodoDtoType = DtoFromSchema<typeof UpdateTodoSchema>

export class TodoDto extends createDto(TodoSchema, "TodoDto") {}
export type TodoDtoType = DtoFromSchema<typeof TodoSchema>
