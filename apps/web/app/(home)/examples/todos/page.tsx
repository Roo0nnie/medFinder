"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type z from "zod"

import { CreateTodoSchema, type Todo } from "@repo/contracts"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/core/components/ui/item"
import { env } from "@/env"

const URL = `${env.NEXT_PUBLIC_API_BASE_URL}/${env.NEXT_PUBLIC_API_VERSION}/examples/todos`

export default function TodosPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["todos", URL],
		queryFn: async () => {
			const response = await fetch(URL, {
				credentials: "include",
			}).then(res => res.json())

			return response
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

			<AddTodo />

			<div className="mt-4 flex flex-col gap-2">
				{!isLoading && data?.data.map((todo: Todo) => <TodoItem key={todo.id} todo={todo} />)}
			</div>
		</div>
	)
}

function TodoItem({ todo }: { todo: Todo }) {
	const queryClient = useQueryClient()

	const { mutate: toggleTodo } = useMutation({
		mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
			const response = await fetch(`${URL}/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ completed }),
			})
			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos", URL] })
		},
	})

	return (
		<Item title={todo.title} variant="muted" className="border-border border">
			<ItemMedia variant="icon">
				<Checkbox
					checked={todo.completed}
					onCheckedChange={() => toggleTodo({ id: todo.id, completed: !todo.completed })}
				/>
			</ItemMedia>
			<ItemContent>
				<ItemTitle className={todo.completed ? "text-muted-foreground line-through" : ""}>
					{todo.title}
				</ItemTitle>
				<ItemDescription>{todo.completed ? "Completed" : "Not completed"}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<ItemActions>
					<Button variant="outline" size="sm">
						Delete
					</Button>
				</ItemActions>
			</ItemActions>
		</Item>
	)
}

function AddTodo() {
	const queryClient = useQueryClient()

	const { mutateAsync: addTodo, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof CreateTodoSchema>) => {
			await fetch(URL, {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(data),
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos", URL] })
		},
	})

	const form = useForm({
		defaultValues: {
			title: "",
			completed: false,
		},
		// validators: {
		// 	onSubmit: CreateTodoSchema,
		// },
		onSubmit: async ({ value }) => {
			await addTodo(value)
		},
	})
	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle>Add Todo</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={e => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<FieldGroup className="flex flex-row">
						<form.Field
							name="title"
							children={field => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-slot="field-content" className="flex flex-row gap-2">
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onChange={e => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											className="flex-4"
										/>
										<Button type="submit" disabled={isPending} className="flex-1">
											{isPending ? "Adding..." : "Add"}
										</Button>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}
