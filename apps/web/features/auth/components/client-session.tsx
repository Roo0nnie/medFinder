"use client"

import { Skeleton } from "@/core/components/ui/skeleton"
import { useSessionQuery } from "@/features/auth/api/session.hooks"

export function ClientSession() {
	const { data: session, isPending, error } = useSessionQuery()

	if (isPending) {
		return (
			<div className="space-y-2">
				<p className="text-sm font-medium">Client Session</p>
				<Skeleton className="h-20 w-full" />
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<p className="text-sm font-medium">Client Session</p>
				<p className="text-destructive text-xs">Error: {error.message}</p>
			</div>
		)
	}

	return (
		<div>
			<p className="text-sm font-medium">Client Session</p>
			<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
		</div>
	)
}
