"use client"

import { useForm } from "@tanstack/react-form"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Field, FieldGroup } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { Spinner } from "@/core/components/ui/spinner"

import { useCreateTodoMutation } from "../api/todos.hooks"

export function AddTodoForm() {
	const { mutateAsync: addTodo, isPending, error } = useCreateTodoMutation()

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
		<Card className="border">
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
