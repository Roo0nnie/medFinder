"use client"

import { useQuery } from "@tanstack/react-query"

import type { Todo } from "@repo/contracts"

import { Checkbox } from "@/core/components/ui/checkbox"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/core/components/ui/item"
import { env } from "@/env"

export default function TodosPage() {
	const url = `${env.NEXT_PUBLIC_API_BASE_URL}/${env.NEXT_PUBLIC_API_VERSION}/examples/todos`

	const { data, isLoading } = useQuery({
		queryKey: ["todos", url],
		queryFn: async () => {
			const response = await fetch(url, {
				credentials: "include",
			})
			return response.json()
		},
	})

	return (
		<div>
			<h1 className="mb-4 text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Todos</h1>
			<p className="text-lg text-zinc-600 dark:text-zinc-400">
				This page integrates with the backend API at{" "}
				<code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">
					/api/v1/examples/todos
				</code>
			</p>

			<div className="mt-4 flex flex-col gap-2">
				{!isLoading &&
					data?.data.map((todo: Todo) => (
						<Item key={todo.id} title={todo.title} variant="muted" className="border-border border">
							<ItemMedia variant="icon">rawr</ItemMedia>
							<ItemContent>
								<ItemTitle>{todo.title}</ItemTitle>
								<ItemDescription>{todo.completed ? "Completed" : "Not completed"}</ItemDescription>
							</ItemContent>
						</Item>
					))}
			</div>
		</div>
	)
}
