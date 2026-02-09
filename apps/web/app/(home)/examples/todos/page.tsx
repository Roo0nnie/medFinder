import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"
import { AddTodoForm } from "@/features/todos/components/add-todo-form"
import { TodosList } from "@/features/todos/components/todos-list"

export default async function TodosRoutePage() {
	const session = await getSession()

	if (!session) {
		redirect("/login")
	}

	return (
		<div>
			<h1 className="mb-4 text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Todos</h1>
			<p className="text-lg text-zinc-600 dark:text-zinc-400">
				This page integrates with backend API using oRPC for type-safe API calls
			</p>

			<div className="mt-4 flex flex-col gap-4">
				<AddTodoForm />
				<TodosList />
			</div>
		</div>
	)
}
