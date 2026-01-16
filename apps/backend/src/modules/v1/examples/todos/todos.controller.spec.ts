import { Test, type TestingModule } from "@nestjs/testing"
import { type UserSession } from "@thallesp/nestjs-better-auth"

import { type Todo } from "@repo/contracts"

import { TodosController } from "./todos.controller"
import { TodosService } from "./todos.service"

jest.mock("@thallesp/nestjs-better-auth", () => ({
	AllowAnonymous: () => () => undefined,
	Session: () => () => ({ user: { id: "template-user-id" } }),
}))

jest.mock("@/common/database/database.client", () => ({
	db: {
		select: jest.fn(),
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
}))

const USER_ID = "template-user-id"
const now = new Date().toISOString()

describe("TodosController (v1)", () => {
	let app: TestingModule
	let controller: TodosController
	let mockDb: {
		select: jest.Mock
		insert: jest.Mock
		update: jest.Mock
		delete: jest.Mock
	}

	// Factory functions for test data
	const createMockTodo = (overrides?: Partial<Todo>): Todo => ({
		id: 1,
		title: "Test todo",
		completed: false,
		authorId: USER_ID,
		createdAt: now,
		updatedAt: now,
		...overrides,
	})

	// Helper to set up select mock
	const setupSelectMock = (returnData: Todo | Todo[]) => {
		const data = Array.isArray(returnData) ? returnData : [returnData]
		mockDb.select.mockReturnValueOnce({
			from: jest.fn(() => ({
				where: jest.fn(() => Promise.resolve(data)),
				then: (resolve: (value: Todo[]) => void) => resolve(data),
			})),
		})
	}

	// Helper to set up insert mock
	const setupInsertMock = (returnData: Todo) => {
		mockDb.insert.mockReturnValueOnce({
			values: jest.fn(() => ({
				returning: jest.fn(async () => [returnData]),
			})),
		})
	}

	// Helper to set up update mock
	const setupUpdateMock = (returnData: Todo) => {
		mockDb.update.mockReturnValueOnce({
			set: jest.fn(() => ({
				where: jest.fn(() => ({
					returning: jest.fn(async () => [returnData]),
				})),
			})),
		})
	}

	// Helper to set up delete mock
	const setupDeleteMock = () => {
		mockDb.delete.mockReturnValueOnce({
			where: jest.fn(() => Promise.resolve(undefined)),
		})
	}

	beforeEach(async () => {
		const dbMock = require("@/common/database/database.client")
		mockDb = dbMock.db

		app = await Test.createTestingModule({
			controllers: [TodosController],
			providers: [TodosService],
		}).compile()

		controller = app.get<TodosController>(TodosController)
	})

	it("returns todos decorated with apiVersion", async () => {
		const mockTodos = [
			createMockTodo({ id: 1, title: "First todo example" }),
			createMockTodo({ id: 2, title: "Second todo example", completed: true }),
		]
		setupSelectMock(mockTodos)

		const result = await controller.getTodos()

		expect(result.success).toBe(true)
		expect(result.data).toHaveLength(2)
		expect(result.data[0]).toMatchObject({
			title: "First todo example",
			id: 1,
			completed: false,
		})
		expect(result.data[1]).toMatchObject({
			title: "Second todo example",
			id: 2,
			completed: true,
		})
	})

	it("creates a new todo", async () => {
		const newTodo = createMockTodo({ id: 3, title: "Versioned", completed: true })
		setupInsertMock(newTodo)

		const mockSession = { user: { id: USER_ID } } as UserSession
		const result = await controller.createTodo({ title: "Versioned", completed: true }, mockSession)

		expect(result.data).toMatchObject({
			title: "Versioned",
			completed: true,
		})
	})

	it("replaces a todo completely", async () => {
		const existingTodo = createMockTodo({ id: 3 })
		const replaced = createMockTodo({
			id: 3,
			title: "Replaced",
			completed: true,
		})
		// First mock call: findOne check
		setupSelectMock(existingTodo)
		// Second mock call: update and return
		setupUpdateMock(replaced)

		const result = await controller.replaceTodo("3", {
			title: "Replaced",
			completed: true,
		})

		expect(result.data).toMatchObject({
			id: 3,
			title: "Replaced",
			completed: true,
		})
	})

	it("updates a todo partially", async () => {
		const existingTodo = createMockTodo({ id: 3 })
		const updated = createMockTodo({
			id: 3,
			title: "Updated Title",
		})
		// First mock call: findOne check
		setupSelectMock(existingTodo)
		// Second mock call: update and return
		setupUpdateMock(updated)

		const result = await controller.updateTodo("3", {
			title: "Updated Title",
		})

		expect(result.data).toMatchObject({
			id: 3,
			title: "Updated Title",
		})
	})

	it("deletes a todo", async () => {
		const existingTodo = createMockTodo({ id: 3 })
		// First mock call: findOne check
		setupSelectMock(existingTodo)
		// Second mock call: delete
		setupDeleteMock()

		await controller.removeTodo("3")

		expect(mockDb.delete).toHaveBeenCalled()
	})
})
