import { Controller } from "@nestjs/common"
import { Implement } from "@orpc/nest"
import { implement } from "@orpc/server"
import { Session, type UserSession } from "@thallesp/nestjs-better-auth"

import { v1 } from "@/config/api-versions.config"

import { TodosService } from "./todos.service"

@Controller()
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Implement(v1.todo.list)
	async listTodos() {
		return implement(v1.todo.list).handler(async () => {
			return this.todosService.findAll()
		})
	}

	@Implement(v1.todo.get)
	async getTodo() {
		return implement(v1.todo.get).handler(async ({ input }) => {
			return this.todosService.findOne(Number(input.id))
		})
	}

	@Implement(v1.todo.create)
	async createTodo(
		@Session()
		session: UserSession
	) {
		return implement(v1.todo.create).handler(async ({ input }) => {
			return this.todosService.create(input, session.user.id)
		})
	}

	@Implement(v1.todo.update)
	async updateTodo() {
		return implement(v1.todo.update).handler(async ({ input }) => {
			return this.todosService.update(Number(input.id), input)
		})
	}

	@Implement(v1.todo.delete)
	async removeTodo() {
		return implement(v1.todo.delete).handler(async ({ input }) => {
			return this.todosService.delete(Number(input.id))
		})
	}
}
