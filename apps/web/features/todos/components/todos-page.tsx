"use client"

import { AddTodoForm } from "./add-todo-form"
import { TodosList } from "./todos-list"

export function TodosPage() {
	return (
		<div>
			<h1 className="mb-4 text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Todos</h1>
			<p className="text-lg text-zinc-600 dark:text-zinc-400">
				This page integrates with backend API using oRPC for type-safe API calls
			</p>

			<AddTodoForm />

			<div className="mt-4">
				<TodosList />
			</div>
		</div>
	)
}
