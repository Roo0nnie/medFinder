import { type UserSession } from "@thallesp/nestjs-better-auth"

import { type Todo } from "@repo/contracts"

import { db as mockDb } from "@/common/database/database.client"

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
	let controller: TodosController
	let service: TodosService
	let selectMock: jest.Mock
	let insertMock: jest.Mock
	let updateMock: jest.Mock
	let deleteMock: jest.Mock

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
		selectMock.mockReturnValueOnce({
			from: jest.fn(() => ({
				where: jest.fn(() => Promise.resolve(data)),
				then: (resolve: (value: Todo[]) => void) => resolve(data),
			})),
		})
	}

	// Helper to set up insert mock
	const setupInsertMock = (returnData: Todo) => {
		insertMock.mockReturnValueOnce({
			values: jest.fn(() => ({
				returning: jest.fn(async () => [returnData]),
			})),
		})
	}

	// Helper to set up update mock
	const setupUpdateMock = (returnData: Todo) => {
		updateMock.mockReturnValueOnce({
			set: jest.fn(() => ({
				where: jest.fn(() => ({
					returning: jest.fn(async () => [returnData]),
				})),
			})),
		})
	}

	// Helper to set up delete mock
	const setupDeleteMock = () => {
		deleteMock.mockReturnValueOnce({
			where: jest.fn(() => Promise.resolve(undefined)),
		})
	}

	beforeEach(() => {
		jest.clearAllMocks()

		selectMock = mockDb.select as jest.Mock
		insertMock = mockDb.insert as jest.Mock
		updateMock = mockDb.update as jest.Mock
		deleteMock = mockDb.delete as jest.Mock

		service = new TodosService()
		controller = new TodosController(service)
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
		const newTodo = createMockTodo({ id: 3, title: "Versioned" })
		setupInsertMock(newTodo)

		const mockSession = { user: { id: USER_ID } } as UserSession
		const result = await controller.createTodo({ title: "Versioned", completed: true }, mockSession)

		expect(result.data).toMatchObject({
			title: "Versioned",
			completed: true,
		})
	})

	it("replaces a todo completely", async () => {
		const replaced = createMockTodo({
			id: 3,
			title: "Replaced",
			completed: true,
		})
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
		const updated = createMockTodo({
			id: 3,
			title: "Updated Title",
		})
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
		setupDeleteMock()

		await controller.removeTodo("3")

		expect(deleteMock).toHaveBeenCalled()
	})
})
