"use client"

import Link from "next/link"

import { buttonVariants } from "@/core/components/ui/button"
import { Separator } from "@/core/components/ui/separator"

export function NavigationLinks() {
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
			</div>
		</div>
	)
}
