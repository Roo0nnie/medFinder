import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"

import { CreateTodoDto, TodoListResponseDto, TodoResponseDto, UpdateTodoDto } from "@repo/contracts"

import { TodosService } from "./todos.service"

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Get()
	@ApiOperation({ summary: "Get all todos" })
	@ApiResponse({
		status: 200,
		description: "List of todos",
		type: TodoListResponseDto,
	})
	@AllowAnonymous()
	async getTodos() {
		const todos = await this.todosService.findAll()
		return {
			success: true,
			data: todos,
		}
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({
		status: 200,
		description: "Todo found",
		type: TodoResponseDto,
	})
	async getTodo(@Param("id") id: string) {
		const todo = await this.todosService.findOne(Number(id))
		return {
			success: true,
			data: todo,
		}
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ApiResponse({
		status: 201,
		description: "Todo created successfully",
		type: TodoResponseDto,
	})
	@AllowAnonymous()
	async createTodo(@Body() payload: CreateTodoDto) {
		const todo = await this.todosService.create(payload)
		return {
			success: true,
			data: todo,
		}
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({
		status: 200,
		description: "Todo replaced successfully",
		type: TodoResponseDto,
	})
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto) {
		const todo = await this.todosService.replace(Number(id), payload)
		return {
			success: true,
			data: todo,
		}
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({
		status: 200,
		description: "Todo updated successfully",
		type: TodoResponseDto,
	})
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto) {
		const todo = await this.todosService.update(Number(id), payload)
		return {
			success: true,
			data: todo,
		}
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({
		status: 200,
		description: "Todo deleted successfully",
		type: TodoResponseDto,
	})
	async removeTodo(@Param("id") id: string) {
		const todo = await this.todosService.remove(Number(id))
		return {
			success: true,
			data: todo,
		}
	}
}
