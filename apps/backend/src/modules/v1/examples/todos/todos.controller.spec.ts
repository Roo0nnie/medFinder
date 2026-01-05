import { type DBType } from "@/common/database/database.providers"

import { TodosController } from "./todos.controller"
import { Todo } from "@repo/contracts"

import { TodosService } from "./todos.service"

describe("TodosController (v1)", () => {
	let controller: TodosController
	let service: TodosService
	let mockDb: DBType

	const mockTodos: Todo[] = [
		{
			id: 1,
			title: "First todo example",
			completed: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 2,
			title: "Second todo example",
			completed: true,
			createdAt: new Date(),
			updatedAt: new Date(),
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
		expect(todos).toHaveLength(2)
		expect(todos.every(todo => todo.apiVersion === "1")).toBe(true)
		expect(todos[0]).toEqual(
			expect.objectContaining({ title: "First todo example", apiVersion: "1" })
		)
		expect(todos[1]).toEqual(
			expect.objectContaining({ title: "Second todo example", apiVersion: "1" })
		)
	})

	it("creates and returns versioned todo", async () => {
		const created = await controller.createTodo({ title: "Versioned", completed: true })
		expect(created).toEqual(
			expect.objectContaining({
				title: "Versioned",
				completed: true,
				apiVersion: "1",
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
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
			})),
		})

		const created = await controller.createTodo({ title: "Updatable" })

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

		const replaced = await controller.replaceTodo(String(created.id), {
			title: "Replaced",
			completed: true,
		})
		expect(replaced.apiVersion).toBe("1")

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

		const patched = await controller.updateTodo(String(created.id), { completed: false })
		expect(patched).toEqual(
			expect.objectContaining({
				id: created.id,
				title: "Replaced",
				completed: false,
				apiVersion: "1",
			})
		)
	})
})
