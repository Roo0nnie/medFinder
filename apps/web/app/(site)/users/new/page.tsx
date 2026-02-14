import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"

import { UserForm } from "@/features/users/components/user-form"

import { NewUserClient } from "./new-user-client"

export default function NewUserPage() {
	return (
		<div className="flex flex-col gap-6 p-4">
			<h1 className="text-2xl font-bold">Add user</h1>
			<Card>
				<CardHeader>
					<CardTitle>Create user</CardTitle>
				</CardHeader>
				<CardContent>
					<NewUserClient />
				</CardContent>
			</Card>
		</div>
	)
}
