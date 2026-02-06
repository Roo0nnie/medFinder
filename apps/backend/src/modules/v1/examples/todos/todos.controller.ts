import { Controller } from "@nestjs/common"
import { Implement } from "@orpc/nest"
import { implement } from "@orpc/server"
import { Session, type UserSession } from "@thallesp/nestjs-better-auth"

import { contract } from "@repo/contracts"

import { TodosService } from "./todos.service"

@Controller()
export class TodosController {
	constructor(private readonly todosService: TodosService) {}

	@Implement(contract.todo.list)
	async listTodos() {
		return implement(contract.todo.list).handler(async () => {
			return this.todosService.findAll()
		})
	}

	@Implement(contract.todo.get)
	async getTodo() {
		return implement(contract.todo.get).handler(async ({ input }) => {
			return this.todosService.findOne(Number(input.id))
		})
	}

	@Implement(contract.todo.create)
	async createTodo(
		@Session()
		session: UserSession
	) {
		return implement(contract.todo.create).handler(async ({ input }) => {
			return this.todosService.create(input, session.user.id)
		})
	}

	@Implement(contract.todo.update)
	async updateTodo() {
		return implement(contract.todo.update).handler(async ({ input }) => {
			return this.todosService.update(Number(input.id), input)
		})
	}

	@Implement(contract.todo.delete)
	async removeTodo() {
		return implement(contract.todo.delete).handler(async ({ input }) => {
			return this.todosService.delete(Number(input.id))
		})
	}
}
