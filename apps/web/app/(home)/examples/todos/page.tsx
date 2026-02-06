"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { type Todo } from "@repo/contracts"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Field, FieldError, FieldGroup } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/core/components/ui/item"
import { orpc } from "@/services/orpc/orpc-client"

export default function TodosPage() {
	const { data, isLoading } = useQuery({
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

			{/* <AddTodo /> */}

			<div className="mt-4 flex flex-col gap-2">
				{/* {!isLoading && data?.map(todo => <TodoItem key={todo.id} todo={todo} />)} */}
				{JSON.stringify(data)}
				{!isLoading &&
					data &&
					data?.map(todo => (
						<div key={todo.id}>
							<h1>{todo.title}</h1>
							<h1>{todo.completed}</h1>
						</div>
					))}
			</div>
		</div>
	)
}

// function TodoItem({ todo }: { todo: Todo }) {
// 	const queryClient = useQueryClient()

// 	const { mutate: toggleTodo } = useMutation({
// 		mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
// 			const response = await orpc.todos.update({ id, data: { completed } })
// 			return response
// 		},
// 		onSuccess: () => {
// 			queryClient.invalidateQueries({ queryKey: ["todos"] })
// 		},
// 	})

// 	return (
// 		<Item title={todo.title} variant="muted" className="border-border border">
// 			<ItemMedia variant="icon">
// 				<Checkbox
// 					checked={todo.completed}
// 					onCheckedChange={() => toggleTodo({ id: todo.id, completed: !todo.completed })}
// 				/>
// 			</ItemMedia>
// 			<ItemContent>
// 				<ItemTitle className={todo.completed ? "text-muted-foreground line-through" : ""}>
// 					{todo.title}
// 				</ItemTitle>
// 				<ItemDescription>{todo.completed ? "Completed" : "Not completed"}</ItemDescription>
// 			</ItemContent>
// 			<ItemActions>
// 				<ItemActions>
// 					<Button variant="outline" size="sm">
// 						Delete
// 					</Button>
// 				</ItemActions>
// 			</ItemActions>
// 		</Item>
// 	)
// }

// function AddTodo() {
// 	const queryClient = useQueryClient()

// 	const { mutateAsync: addTodo, isPending } = useMutation({
// 		mutationFn: async (data: { title: string; completed: boolean }) => {
// 			const response = await orpc.todos.create(data)
// 			return response
// 		},
// 		onSuccess: () => {
// 			queryClient.invalidateQueries({ queryKey: ["todos"] })
// 		},
// 	})

// 	const form = useForm({
// 		defaultValues: {
// 			title: "",
// 			completed: false,
// 		},
// 		// validators: {
// 		// 	onSubmit: CreateTodoSchema,
// 		// },
// 		onSubmit: async ({ value }) => {
// 			await addTodo({ title: value.title, completed: value.completed })
// 			form.reset()
// 		},
// 	})
// 	return (
// 		<Card className="mt-4">
// 			<CardHeader>
// 				<CardTitle>Add Todo</CardTitle>
// 			</CardHeader>
// 			<CardContent>
// 				<form
// 					onSubmit={e => {
// 						e.preventDefault()
// 						form.handleSubmit()
// 					}}
// 				>
// 					<FieldGroup className="flex flex-row">
// 						<form.Field
// 							name="title"
// 							children={field => {
// 								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
// 								return (
// 									<Field data-slot="field-content" className="flex flex-row gap-2">
// 										<Input
// 											id={field.name}
// 											name={field.name}
// 											value={field.state.value}
// 											onChange={e => field.handleChange(e.target.value)}
// 											aria-invalid={isInvalid}
// 											className="flex-4"
// 										/>
// 										<Button type="submit" disabled={isPending} className="flex-1">
// 											{isPending ? "Adding..." : "Add"}
// 										</Button>
// 										{isInvalid && <FieldError errors={field.state.meta.errors} />}
// 									</Field>
// 								)
// 							}}
// 						/>
// 					</FieldGroup>
// 				</form>
// 			</CardContent>
// 		</Card>
// 	)
// }
