import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { desc, eq } from "drizzle-orm"

import type {
	CreateTodoInput,
	TodoIdInput,
	UpdateTodoRequest,
} from "@/config/contract-types"
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
		const idNum = id as number
		const [todo] = await db.select().from(todos).where(eq(todos.id, idNum))
		if (!todo) throw new NotFoundException(`Todo with ID ${idNum} not found`)
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

	async update({ payload }: { payload: UpdateTodoRequest }) {
		const id = payload.id as number
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
		const idNum = id as number
		await db.delete(todos).where(eq(todos.id, idNum))
		return { success: true, id }
	}
}
