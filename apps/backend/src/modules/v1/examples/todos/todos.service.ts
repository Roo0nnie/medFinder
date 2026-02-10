import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { desc, eq } from "drizzle-orm"

import { CreateTodoInput, TodoIdInput, UpdateTodoInput } from "@repo/contracts"
import { todos } from "@repo/db/schema"

import { db } from "@/common/database/database.client"

@Injectable()
export class TodosService {
	async findAll() {
		const result = await db
			.select()
			.from(todos)
			.orderBy(desc(todos.completed), desc(todos.updatedAt))
		return result
	}

	async findOne({ id }: { id: TodoIdInput["id"] }) {
		const [todo] = await db.select().from(todos).where(eq(todos.id, id))
		if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`)
		return todo
	}

	async create({ payload, authorId }: { payload: CreateTodoInput; authorId: string }) {
		const [todo] = await db
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

	async update({ id, payload }: { id: TodoIdInput["id"]; payload: UpdateTodoInput }) {
		await this.findOne({ id })
		const [todo] = await db
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

	async delete({ id }: { id: TodoIdInput["id"] }) {
		await db.delete(todos).where(eq(todos.id, id))
		return { success: true, id }
	}
}
