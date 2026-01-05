import { Inject, Injectable } from "@nestjs/common"
import { eq } from "drizzle-orm"

import { CreateTodoDto, UpdateTodoDto } from "@repo/contracts"
import { todos } from "@repo/db/schema"

import { DB, type DBType } from "@/common/database/database.providers"

export type Todo = {
	id: number
	title: string
	completed: boolean
	createdAt: Date
	updatedAt: Date
}

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
		if (!todo) {
			throw new Error("Todo not replaced")
		}
		return todo
	}

	async update(id: number, payload: UpdateTodoDto): Promise<Todo> {
		const updateData: { title?: string; completed?: boolean; updatedAt: Date } = {
			updatedAt: new Date(),
		}

		if ("title" in payload && payload.title !== undefined) {
			updateData.title = payload.title
		}

		if ("completed" in payload && payload.completed !== undefined) {
			updateData.completed = payload.completed
		}

		const [todo] = await this.db.update(todos).set(updateData).where(eq(todos.id, id)).returning()

		if (!todo) throw new Error("Todo not updated")

		return todo
	}

	async remove(id: number): Promise<void> {
		await this.findOne(id)
		await this.db.delete(todos).where(eq(todos.id, id))
	}
}
