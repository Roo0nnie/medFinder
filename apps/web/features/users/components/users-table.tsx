"use client"

import { Pencil, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { Button } from "@/core/components/ui/button"
import { buttonVariants } from "@/core/components/ui/button-variants"
import { cn } from "@/core/lib/utils"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { Spinner } from "@/core/components/ui/spinner"

import type { User } from "@repo/contracts"

import { useDeleteUserMutation } from "../api/users.hooks"

interface UsersTableProps {
	users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
	const { mutate: deleteUser, isPending: isDeletePending } = useDeleteUserMutation()

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map(user => (
					<TableRow key={user.id}>
						<TableCell>
							{[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || user.email}
						</TableCell>
						<TableCell>{user.email}</TableCell>
						<TableCell>{user.role}</TableCell>
						<TableCell className="text-right">
							<Link
								href={`/users/${user.id}/edit` as any}
								className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
								aria-label="Edit user"
							>
								<HugeiconsIcon icon={Pencil} className="size-4" />
							</Link>
							<Button
								variant="ghost"
								size="icon"
								className="hover:text-destructive"
								onClick={() => deleteUser(user.id)}
								disabled={isDeletePending}
							>
								{isDeletePending ? (
									<Spinner className="size-4 animate-spin" />
								) : (
									<HugeiconsIcon icon={Trash} className="size-4" />
								)}
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
