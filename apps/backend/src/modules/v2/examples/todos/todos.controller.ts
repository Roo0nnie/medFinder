import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Put,
} from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { Session, type UserSession } from "@thallesp/nestjs-better-auth"

import { CreateTodoDto, TodoDto, TodoListDto, UpdateTodoDto } from "@repo/contracts"

import { ApiEndpoint } from "@/common/decorators/api-endpoint.decorator"

import { TodosService } from "./todos.service"

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "2" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Get()
	@ApiEndpoint({
		summary: "Retrieve all todos (V2)",
		description:
			"Returns a list of all todos for authenticated user. V2 includes additional metadata.",
		response: TodoListDto,
	})
	async getTodos() {
		return this.todosService.findAll()
	}

	@Get(":id")
	@ApiEndpoint({
		summary: "Retrieve a todo by ID (V2)",
		description: "Returns a single todo. Returns 404 if not found.",
		response: TodoDto,
	})
	async getTodo(@Param("id", ParseIntPipe) id: number) {
		return this.todosService.findOne(id)
	}

	@Post()
	@ApiEndpoint({
		summary: "Create a new todo (V2)",
		description: "Creates a new todo item for authenticated user. V2 supports priority field.",
		response: TodoDto,
		status: 201,
	})
	async createTodo(@Body() payload: CreateTodoDto, @Session() session: UserSession) {
		return this.todosService.create(payload, session.user.id)
	}

	@Put(":id")
	@ApiEndpoint({
		summary: "Replace an existing todo (V2)",
		description: "Replaces all fields of an existing todo with provided values.",
		response: TodoDto,
	})
	async replaceTodo(@Param("id", ParseIntPipe) id: number, @Body() payload: CreateTodoDto) {
		return this.todosService.replace(id, payload)
	}

	@Patch(":id")
	@ApiEndpoint({
		summary: "Update an existing todo (V2)",
		description: "Updates only the fields provided in the request body.",
		response: TodoDto,
	})
	async updateTodo(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateTodoDto) {
		return this.todosService.update(id, payload)
	}

	@Delete(":id")
	@ApiEndpoint({
		summary: "Delete a todo (V2)",
		description: "Permanently deletes a todo and returns the deleted item.",
		response: TodoDto,
	})
	async removeTodo(@Param("id", ParseIntPipe) id: number) {
		return this.todosService.remove(id)
	}
}
