"use client"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Spinner } from "@/core/components/ui/spinner"

import { useUsersQuery } from "@/features/users/api/users.hooks"
import { UsersTable } from "@/features/users/components/users-table"

export function UsersListClient() {
	const { data, isLoading, error } = useUsersQuery()

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-zinc-600">
				<Spinner className="size-4 animate-spin" />
				Loading users...
			</div>
		)
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0 text-red-600" />
				<AlertDescription>Failed to load users. Please try again.</AlertDescription>
			</Alert>
		)
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>No users</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">No users yet. Add one to get started.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>All users</CardTitle>
			</CardHeader>
			<CardContent>
				<UsersTable users={data} />
			</CardContent>
		</Card>
	)
}
