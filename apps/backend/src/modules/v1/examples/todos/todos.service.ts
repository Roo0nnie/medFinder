import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { desc, eq } from "drizzle-orm"

import { CreateTodoInput, Todo, UpdateTodoInput } from "@repo/contracts"
import { todos } from "@repo/db/schema"

import { db } from "@/common/database/database.client"

@Injectable()
export class TodosService {
	async findAll(): Promise<Todo[]> {
		const result = await db.select().from(todos).orderBy(desc(todos.updatedAt))
    return result
	}

	async findOne(id: number): Promise<Todo> {
		const [todo] = await db.select().from(todos).where(eq(todos.id, id))
		if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`)
		return todo
	}

	async create(payload: CreateTodoInput, authorId: string) {
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

	async update(id: number, payload: UpdateTodoInput) {
		await this.findOne(id)
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

	async delete(id: number) {
		await db.delete(todos).where(eq(todos.id, id))
		return { success: true, id }
	}
}
