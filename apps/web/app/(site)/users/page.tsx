import Link from "next/link"

import { Button } from "@/core/components/ui/button"

import { UsersListClient } from "./users-list-client"

export default function UsersPage() {
	return (
		<div className="flex flex-col gap-6 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Users</h1>
				<Button asChild>
					<Link href="/users/new">Add user</Link>
				</Button>
			</div>
			<UsersListClient />
		</div>
	)
}
