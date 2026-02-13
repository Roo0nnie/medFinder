"use client"

import { Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/core/components/ui/item"
import { Spinner } from "@/core/components/ui/spinner"

import { useDeleteTodoMutation, useUpdateTodoMutation } from "../api/todos.hooks"
import type { Todo } from "../api/todos.types"

interface TodoItemProps {
	todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
	const { mutate: toggleTodo, isPending: isTogglePending } = useUpdateTodoMutation()
	const { mutate: deleteTodo, isPending: isDeletePending } = useDeleteTodoMutation()

	const handleUpdate = () => toggleTodo({ id: todo.id, completed: !todo.completed })
	const handleDelete = () => deleteTodo({ id: todo.id })

	return (
		<Item title={todo.title} variant="muted" className="border-border border">
			<ItemMedia variant="icon">
				<Checkbox
					checked={todo.completed}
					disabled={isTogglePending}
					onCheckedChange={handleUpdate}
					className="hover:cursor-pointer"
				/>
			</ItemMedia>
			<ItemContent>
				<ItemTitle className={todo.completed ? "text-muted-foreground line-through" : ""}>
					{todo.title}
				</ItemTitle>
				<ItemDescription>{todo.completed ? "Completed" : "Not completed"}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Button
					variant="ghost"
					size="icon"
					className="hover:text-destructive"
					onClick={handleDelete}
					disabled={isDeletePending}
				>
					{isDeletePending ? (
						<Spinner className="size-4 animate-spin" />
					) : (
						<HugeiconsIcon icon={Trash} className="size-4" />
					)}
				</Button>
			</ItemActions>
		</Item>
	)
}
