"use client"

import { Checkbox } from "@/core/components/ui/checkbox"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/core/components/ui/item"
import { orpc, type InferArrayItem } from "@/services/orpc/orpc-client"

import { useUpdateTodoMutation } from "../api/todos.hooks"

interface TodoItemProps {
	todo: InferArrayItem<typeof orpc.todo.list>
}

export function TodoItem({ todo }: TodoItemProps) {
	const { mutate: toggleTodo, isPending } = useUpdateTodoMutation()

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
