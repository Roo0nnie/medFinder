"use client"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Field, FieldGroup } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/core/components/ui/item"
import { Spinner } from "@/core/components/ui/spinner"
import { orpc, type InferArrayItem } from "@/services/orpc/orpc-client"

export default function TodosPage() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["todos"],
		queryFn: async () => {
			const response = await orpc.todo.list()
			return response
		},
	})

	return (
		<div>
			<h1 className="mb-4 text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Todos</h1>
			<p className="text-lg text-zinc-600 dark:text-zinc-400">
				This page integrates with backend API using oRPC for type-safe API calls
			</p>

			<AddTodo />

			{isLoading && (
				<div className="mt-4 flex items-center gap-2 text-zinc-600">
					<Spinner className="size-4 animate-spin" />
					Loading todos...
				</div>
			)}

			{error && (
				<Alert variant="destructive" className="mt-4">
					<HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0 text-red-600" />
					<AlertDescription>Failed to load todos. Please try again.</AlertDescription>
				</Alert>
			)}

			<div className="mt-4 flex flex-col gap-2">
				{!isLoading && data && data.length === 0 && (
					<p className="text-zinc-500 dark:text-zinc-400">No todos yet. Create one above!</p>
				)}
				{!isLoading && data?.map(todo => <TodoItem key={todo.id} todo={todo} />)}
			</div>
		</div>
	)
}

function TodoItem({ todo }: { todo: InferArrayItem<typeof orpc.todo.list> }) {
	const queryClient = useQueryClient()

	const { mutate: toggleTodo, isPending } = useMutation({
		mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
			const response = await orpc.todo.update({ id, completed })
			return response
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] })
		},
	})

	return (
		<Item title={todo.title} variant="muted" className="border-border border">
			<ItemMedia variant="icon">
				<Checkbox
					checked={todo.completed}
					disabled={isPending}
					onCheckedChange={() => toggleTodo({ id: todo.id, completed: !todo.completed })}
					className="hover:cursor-pointer"
				/>
			</ItemMedia>
			<ItemContent>
				<ItemTitle className={todo.completed ? "text-muted-foreground line-through" : ""}>
					{todo.title}
				</ItemTitle>
				<ItemDescription>{todo.completed ? "Completed" : "Not completed"}</ItemDescription>
			</ItemContent>
		</Item>
	)
}

function AddTodo() {
	const queryClient = useQueryClient()

	const {
		mutateAsync: addTodo,
		isPending,
		error,
	} = useMutation({
		mutationFn: async (data: { title: string }) => {
			const response = await orpc.todo.create(data)
			return response
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] })
		},
	})

	const form = useForm({
		defaultValues: {
			title: "",
		},
		onSubmit: async ({ value }) => {
			if (value.title.trim()) {
				await addTodo({ title: value.title.trim() })
				form.reset()
			}
		},
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Todo</CardTitle>
			</CardHeader>
			<CardContent>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>
							{error instanceof Error
								? error.message
								: "Failed to add todo. Make sure you're logged in."}
						</AlertDescription>
					</Alert>
				)}
				<form
					onSubmit={e => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<FieldGroup className="flex flex-row gap-2">
						<form.Field
							name="title"
							children={field => (
								<Field data-slot="field-content" className="flex-1">
									<Input
										id={field.name}
										name={field.name}
										placeholder="Enter a new todo..."
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
								</Field>
							)}
						/>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner className="mr-2 size-4" />}
							{isPending ? "Adding..." : "Add"}
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}
