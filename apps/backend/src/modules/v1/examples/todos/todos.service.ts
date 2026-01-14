import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { eq } from "drizzle-orm"

import { CreateTodoDto, UpdateTodoDto } from "@repo/contracts"
import { todos } from "@repo/db/schema"

import { DB, type DBType } from "@/common/database/database-providers"

@Injectable()
export class TodosService {
	constructor(@Inject(DB) private readonly db: DBType) {}

	async findAll() {
		return this.db.select().from(todos)
	}

	async create(payload: CreateTodoDto, authorId: string) {
		const [todo] = await this.db
			.insert(todos)
			.values({
				title: payload.title,
				completed: payload.completed ?? false,
				authorId,
			})
			.returning()
		if (!todo) throw new InternalServerErrorException("Todo not created")
		return todo
	}

	async findOne(id: number) {
		const [todo] = await this.db.select().from(todos).where(eq(todos.id, id))
		if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`)
		return todo
	}

	async replace(id: number, payload: CreateTodoDto) {
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
		if (!todo) throw new InternalServerErrorException("Todo not replaced")
		return todo
	}

	async update(id: number, payload: UpdateTodoDto) {
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
		if (!todo) throw new InternalServerErrorException("Todo not updated")
		return todo
	}

	async remove(id: number) {
		const todo = await this.findOne(id)
		await this.db.delete(todos).where(eq(todos.id, id))
		return todo
	}
}
