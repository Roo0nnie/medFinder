"use client"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Spinner } from "@/core/components/ui/spinner"

import { useTodosQuery } from "../api/todos.hooks"
import { TodoItem } from "./todo-item"

export function TodosList() {
	const { data, isLoading, error } = useTodosQuery()

	if (isLoading) {
		return (
			<div className="mt-4 flex items-center gap-2 text-zinc-600">
				<Spinner className="size-4 animate-spin" />
				Loading todos...
			</div>
		)
	}

	if (error) {
		return (
			<Alert variant="destructive" className="mt-4">
				<HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0 text-red-600" />
				<AlertDescription>Failed to load todos. Please try again.</AlertDescription>
			</Alert>
		)
	}

	if (!data || data.length === 0) {
		return <p className="text-zinc-500 dark:text-zinc-400">No todos yet. Create one above!</p>
	}

	return (
		<div className="flex flex-col gap-2">
			{data.map(todo => (
				<TodoItem key={todo.id} todo={todo} />
			))}
		</div>
	)
}
