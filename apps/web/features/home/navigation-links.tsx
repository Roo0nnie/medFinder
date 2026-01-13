"use client"

import Link from "next/link"

import { buttonVariants } from "@/core/components/ui/button"
import { Separator } from "@/core/components/ui/separator"
import { authClient } from "@/services/better-auth/auth-client"

export function NavigationLinks() {
	const session = authClient.useSession()
	const isLoggedIn = !!session.data?.user

	const handleSignOut = async () => {
		await authClient.signOut()
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
				<Link
					href="http://localhost:3000/api/docs"
					className={buttonVariants({ variant: "ghost", size: "lg" })}
					target="_blank"
				>
					API Docs
				</Link>
				<Separator orientation="vertical" />
				<Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
					Dashboard
				</Link>
				<Separator orientation="vertical" />
				<Link href="/examples/todos" className={buttonVariants({ variant: "ghost", size: "lg" })}>
					Todos
				</Link>
				{isLoggedIn && (
					<>
						<Separator orientation="vertical" />
						<button
							onClick={handleSignOut}
							className={buttonVariants({ variant: "ghost", size: "lg" })}
						>
							Logout
						</button>
					</>
				)}
			</div>
		</div>
	)
}
