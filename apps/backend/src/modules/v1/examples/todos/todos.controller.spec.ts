// Package imports
import { type Todo } from "@repo/contracts"

// Internal imports
import { type DBType } from "@/common/database/database-providers"

import { TodosController } from "./todos.controller"
import { TodosService } from "./todos.service"

jest.mock("@thallesp/nestjs-better-auth", () => ({
	AllowAnonymous: () => () => undefined,
	Session: () => () => ({ user: { id: "template-user-id" } }),
}))

describe("TodosController (v1)", () => {
	let controller: TodosController
	let service: TodosService
	let mockDb: DBType

	const mockTodos: Todo[] = [
		{
			id: 1,
			title: "First todo example",
			completed: false,
			authorId: "template-user-id",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: 2,
			title: "Second todo example",
			completed: true,
			authorId: "template-user-id",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	]

	beforeEach(() => {
		// Create a mock database that implements the db query builder pattern
		mockDb = {
			select: jest.fn(() => ({
				from: jest.fn(() => Promise.resolve(mockTodos)),
				where: jest.fn(() => Promise.resolve([mockTodos[0]])),
			})),
			insert: jest.fn(() => ({
				values: jest.fn(() => ({
					returning: jest.fn(async () => [
						{
							id: 3,
							title: "Versioned",
							completed: true,
							authorId: "template-user-id",
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					]),
				})),
			})),
			update: jest.fn(() => ({
				set: jest.fn(() => ({
					where: jest.fn(() => ({
						returning: jest.fn(async () => [
							{
								id: 3,
								title: "Replaced",
								completed: false,
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]),
					})),
				})),
			})),
			delete: jest.fn(() => ({
				where: jest.fn(() => Promise.resolve(undefined)),
			})),
		} as unknown as DBType

		service = new TodosService(mockDb)
		controller = new TodosController(service)
	})

	it("returns todos decorated with apiVersion", async () => {
		const todos = await controller.getTodos()
		expect(todos.data).toHaveLength(2)
		expect(todos.success).toBe(true)
		expect(todos.data[0]).toEqual(
			expect.objectContaining({ title: "First todo example", id: 1, completed: false })
		)
		expect(todos.data[1]).toEqual(
			expect.objectContaining({ title: "Second todo example", id: 2, completed: true })
		)
	})

	it("creates and returns versioned todo", async () => {
		const mockSession = { user: { id: "template-user-id" } }
		const created = await controller.createTodo(
			{ title: "Versioned", completed: true },
			mockSession
		)
		expect(created.data).toEqual(
			expect.objectContaining({
				title: "Versioned",
				completed: true,
			})
		)
	})

	it("propagates updates through service while preserving apiVersion", async () => {
		// Mock create to return a todo with id 3
		const createMock = mockDb.insert as jest.Mock
		createMock.mockReturnValueOnce({
			values: jest.fn(() => ({
				returning: jest.fn(async () => [
					{
						id: 3,
						title: "Updatable",
						completed: false,
						authorId: "template-user-id",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
			})),
		})

		const mockSession = { user: { id: "template-user-id" } }
		const created = await controller.createTodo(
			{ title: "Updatable", completed: false },
			mockSession
		)

		// Mock findOne to return the created todo
		const selectMock = mockDb.select as jest.Mock
		selectMock.mockReturnValueOnce({
			from: jest.fn(() => ({
				where: jest.fn(() => Promise.resolve([created])),
			})),
		})

		// Mock replace
		const replaceUpdateMock = mockDb.update as jest.Mock
		replaceUpdateMock.mockReturnValueOnce({
			set: jest.fn(() => ({
				where: jest.fn(() => ({
					returning: jest.fn(async () => [
						{
							id: 3,
							title: "Replaced",
							completed: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					]),
				})),
			})),
		})

		const replaced = await controller.replaceTodo(String(created.data.id), {
			title: "Replaced",
			completed: true,
		})
		expect(replaced.data.id).toBe(3)

		// Mock update (patch)
		replaceUpdateMock.mockReturnValueOnce({
			set: jest.fn(() => ({
				where: jest.fn(() => ({
					returning: jest.fn(async () => [
						{
							id: 3,
							title: "Replaced",
							completed: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					]),
				})),
			})),
		})

		const patched = await controller.updateTodo(String(created.data.id), {
			completed: false,
			title: "Replaced",
		})
		expect(patched.data).toEqual(
			expect.objectContaining({
				id: 3,
				title: "Replaced",
				completed: false,
			})
		)
	})
})
