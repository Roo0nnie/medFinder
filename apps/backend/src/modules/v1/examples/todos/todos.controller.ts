import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Session, type UserSession } from "@thallesp/nestjs-better-auth"

import {
	ApiErrorResponseDto,
	CreateTodoDto,
	TodoDto,
	TodoListDto,
	UpdateTodoDto,
} from "@repo/contracts"

import { TodosService } from "./todos.service"

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Get()
	@ApiOperation({ summary: "Get all todos", description: "List of todos" })
	@ApiResponse({ status: 200, description: "List of todos", type: TodoListDto })
	async getTodos() {
		return this.todosService.findAll()
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo found", type: TodoDto })
	@ApiResponse({ status: 404, description: "Todo not found", type: ApiErrorResponseDto })
	async getTodo(@Param("id") id: string) {
		return this.todosService.findOne(Number(id))
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ApiResponse({ status: 201, description: "Todo created", type: TodoDto })
	@ApiResponse({ status: 400, description: "Validation error", type: ApiErrorResponseDto })
	@ApiResponse({ status: 401, description: "Unauthorized", type: ApiErrorResponseDto })
	async createTodo(@Body() payload: CreateTodoDto, @Session() session: UserSession) {
		return this.todosService.create(payload, session.user.id)
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo replaced", type: TodoDto })
	@ApiResponse({ status: 404, description: "Todo not found", type: ApiErrorResponseDto })
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto) {
		return this.todosService.replace(Number(id), payload)
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo updated", type: TodoDto })
	@ApiResponse({ status: 404, description: "Todo not found", type: ApiErrorResponseDto })
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto) {
		return this.todosService.update(Number(id), payload)
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo deleted", type: TodoDto })
	@ApiResponse({ status: 404, description: "Todo not found", type: ApiErrorResponseDto })
	async removeTodo(@Param("id") id: string) {
		return this.todosService.remove(Number(id))
	}
}
