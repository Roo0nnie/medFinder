"use client"

import { useRouter } from "next/navigation"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Spinner } from "@/core/components/ui/spinner"

import { useUserQuery } from "@/features/users/api/users.hooks"
import { UserForm } from "@/features/users/components/user-form"

interface UserEditClientProps {
	id: string
}

export function UserEditClient({ id }: UserEditClientProps) {
	const router = useRouter()
	const { data: user, isLoading, error } = useUserQuery(id)

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-zinc-600">
				<Spinner className="size-4 animate-spin" />
				Loading user...
			</div>
		)
	}

	if (error || !user) {
		return (
			<Alert variant="destructive">
				<HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0 text-red-600" />
				<AlertDescription>Failed to load user. It may not exist.</AlertDescription>
			</Alert>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || user.email}</CardTitle>
			</CardHeader>
			<CardContent>
				<UserForm
					user={user}
					onSuccess={() => {
						router.push("/users")
						router.refresh()
					}}
				/>
			</CardContent>
		</Card>
	)
}
