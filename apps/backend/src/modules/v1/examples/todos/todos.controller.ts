import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"

import { CreateTodoDto, UpdateTodoDto } from "@repo/contracts"

import { TodosService, type Todo } from "./todos.service"

type TodoV1 = Todo & { apiVersion: "1" }

@ApiTags("todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	private addVersion(todo: Todo): TodoV1 {
		return { ...todo, apiVersion: "1" }
	}

	@Get()
	@ApiOperation({ summary: "Get all todos" })
	@ApiResponse({ status: 200, description: "List of todos" })
	async getTodos(): Promise<TodoV1[]> {
		const todos = await this.todosService.findAll()
		return todos.map(todo => this.addVersion(todo))
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiResponse({ status: 200, description: "Todo found" })
	async getTodo(@Param("id") id: string): Promise<TodoV1> {
		const todo = await this.todosService.findOne(Number(id))
		return this.addVersion(todo)
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ApiResponse({ status: 201, description: "Todo created successfully" })
	async createTodo(@Body() payload: CreateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.create(payload)
		return this.addVersion(todo)
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiResponse({ status: 200, description: "Todo replaced successfully" })
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.replace(Number(id), payload)
		return this.addVersion(todo)
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiResponse({ status: 200, description: "Todo updated successfully" })
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.update(Number(id), payload)
		return this.addVersion(todo)
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiResponse({ status: 200, description: "Todo deleted successfully" })
	async removeTodo(@Param("id") id: string): Promise<void> {
		return this.todosService.remove(Number(id))
	}
}
