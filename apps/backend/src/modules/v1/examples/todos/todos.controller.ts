import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common"
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"

import { CreateTodoDto, Todo, TodoDto, UpdateTodoDto } from "@repo/contracts"

import { TodosService } from "./todos.service"

type TodoV1 = Todo & { apiVersion: "1" }

@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	private addVersion(todo: Todo): TodoV1 {
		return { ...todo, apiVersion: "1" }
	}

	@Get()
	@ApiOperation({ summary: "Get all todos" })
	@ApiResponse({ status: 200, description: "List of todos", type: [TodoDto] })
	async getTodos(): Promise<TodoV1[]> {
		const todos = await this.todosService.findAll()
		return todos.map(todo => this.addVersion(todo))
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a todo by ID" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo found", type: TodoDto })
	async getTodo(@Param("id") id: string): Promise<TodoV1> {
		const todo = await this.todosService.findOne(Number(id))
		return this.addVersion(todo)
	}

	@Post()
	@ApiOperation({ summary: "Create a new todo" })
	@ApiBody({ type: CreateTodoDto })
	@ApiResponse({ status: 201, description: "Todo created successfully", type: TodoDto })
	async createTodo(@Body() payload: CreateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.create(payload)
		return this.addVersion(todo)
	}

	@Put(":id")
	@ApiOperation({ summary: "Replace a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiBody({ type: CreateTodoDto })
	@ApiResponse({ status: 200, description: "Todo replaced successfully", type: TodoDto })
	async replaceTodo(@Param("id") id: string, @Body() payload: CreateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.replace(Number(id), payload)
		return this.addVersion(todo)
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiBody({ type: UpdateTodoDto })
	@ApiResponse({ status: 200, description: "Todo updated successfully", type: TodoDto })
	async updateTodo(@Param("id") id: string, @Body() payload: UpdateTodoDto): Promise<TodoV1> {
		const todo = await this.todosService.update(Number(id), payload)
		return this.addVersion(todo)
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a todo" })
	@ApiParam({ name: "id", type: Number, description: "Todo ID" })
	@ApiResponse({ status: 200, description: "Todo deleted successfully" })
	async removeTodo(@Param("id") id: string): Promise<void> {
		return this.todosService.remove(Number(id))
	}
}
