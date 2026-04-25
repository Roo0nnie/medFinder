import Link from "next/link"

import { buttonVariants } from "@/core/components/ui/button-variants"
import { cn } from "@/core/lib/utils"

import { UsersListClient } from "./users-list-client"

export default function UsersPage() {
	return (
		<div className="flex flex-col gap-6 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Users</h1>
				<Link href={"/users/new" as any} className={cn(buttonVariants({ variant: "default" }))}>
					Add user
				</Link>
			</div>
			<UsersListClient />
		</div>
	)
}
