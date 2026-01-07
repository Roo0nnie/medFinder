import { Inject, Injectable } from "@nestjs/common"
import { eq } from "drizzle-orm"

import {
	CreateTodoDto,
	UpdateTodoDto,
	type CreateTodo,
	type Todo,
	type UpdateTodo,
} from "@repo/contracts"
import { todos } from "@repo/db/schema"

import { DB, type DBType } from "@/common/database/database.providers"

@Injectable()
export class TodosService {
	constructor(@Inject(DB) private readonly db: DBType) {}

	async findAll(): Promise<Todo[]> {
		return this.db.select().from(todos)
	}

	async create(payload: CreateTodoDto): Promise<Todo> {
		const [todo] = await this.db
			.insert(todos)
			.values({
				title: payload.title,
				completed: payload.completed ?? false,
			})
			.returning()

		if (!todo) throw new Error("Todo not created")

		return todo
	}

	async findOne(id: number): Promise<Todo> {
		const [todo] = await this.db.select().from(todos).where(eq(todos.id, id))

		if (!todo) throw new Error(`Todo ${id} not found`)

		return todo
	}

	async replace(id: number, payload: CreateTodoDto): Promise<Todo> {
		await this.findOne(id)
		const [todo] = await this.db
			.update(todos)
			.set({
				title: payload.title,
				completed: payload.completed ?? false,
				updatedAt: new Date(),
			})
			.where(eq(todos.id, id))
			.returning()
		if (!todo) throw new Error("Todo not replaced")
		return todo
	}

	async update(id: number, payload: UpdateTodoDto): Promise<Todo> {
		const [todo] = await this.db
			.update(todos)
			.set({
				title: payload.title,
				completed: payload.completed ?? false,
				updatedAt: new Date(),
			})
			.where(eq(todos.id, id))
			.returning()
		if (!todo) throw new Error("Todo not updated")
		return todo
	}

	async remove(id: number): Promise<void> {
		await this.findOne(id)
		await this.db.delete(todos).where(eq(todos.id, id))
	}
}
