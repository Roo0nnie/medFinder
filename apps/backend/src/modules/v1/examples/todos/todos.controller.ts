import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import { Session, type UserSession } from "@thallesp/nestjs-better-auth"
import { ZodResponse } from "nestjs-zod"

import { CreateTodoDto, ok, TodoDto, TodoListDto, UpdateTodoDto } from "@repo/contracts"

import { TodosService } from "./todos.service"

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Get()
	@ApiOperation({ summary: "Get all todos", description: "List of todos" })
	@ZodResponse({ status: 200, type: TodoListDto, description: "List of todos" })
	async getTodos() {
		const todos = await this.todosService.findAll()
		return ok(todos)
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ZodResponse({ status: 200, description: "Todo found", type: TodoDto })
	async getTodo(@Param("id") id: string) {
		const todo = await this.todosService.findOne(Number(id))
		return ok(todo)
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ZodResponse({ status: 201, description: "Todo created successfully", type: TodoDto })
	async createTodo(@Body() payload: CreateTodoDto, @Session() session: UserSession) {
		const todo = await this.todosService.create(payload, session.user.id)
		return ok(todo)
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ZodResponse({ status: 200, description: "Todo replaced successfully", type: TodoDto })
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto) {
		const todo = await this.todosService.replace(Number(id), payload)
		return ok(todo)
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ZodResponse({ status: 200, description: "Todo updated successfully", type: TodoDto })
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto) {
		const todo = await this.todosService.update(Number(id), payload)
		return ok(todo)
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ZodResponse({ status: 200, description: "Todo deleted successfully", type: TodoDto })
	async removeTodo(@Param("id") id: string) {
		const todo = await this.todosService.remove(Number(id))
		return ok(todo)
	}
}
