import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { CreateTodoDto, TodoDto, UpdateTodoDto } from "@repo/contracts"

import { TodosService } from "./todos.service"

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}
	@Get()
	@ApiOperation({ summary: "Get all todos" })
	@ApiResponse({ status: 200, description: "List of todos", type: [TodoDto] })
	@AllowAnonymous()
	async getTodos() {
		const todos = await this.todosService.findAll()
		return todos
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo found", type: TodoDto })
	async getTodo(@Param("id") id: string) {
		const todo = await this.todosService.findOne(Number(id))
		return todo
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ApiResponse({ status: 201, description: "Todo created successfully", type: TodoDto })
	@AllowAnonymous()
	async createTodo(@Body() payload: CreateTodoDto) {
		const todo = await this.todosService.create(payload)
		return todo
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo replaced successfully", type: TodoDto })
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto) {
		const todo = await this.todosService.replace(Number(id), payload)
		return todo
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo updated successfully", type: TodoDto })
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto) {
		const todo = await this.todosService.update(Number(id), payload)
		return todo
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo deleted successfully" })
	async removeTodo(@Param("id") id: string) {
		return this.todosService.remove(Number(id))
	}
}
