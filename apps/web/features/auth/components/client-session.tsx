"use client"

import { useSessionQuery } from "@/features/auth/api/session.hooks"

export function ClientSession() {
	const { data: session, isPending, error } = useSessionQuery()

	if (isPending) {
		return (
			<div>
				<p className="text-sm font-medium">Client Session</p>
				<p className="text-muted-foreground text-xs">Loading...</p>
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
