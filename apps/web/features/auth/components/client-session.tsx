"use client"

import { authClient } from "@/services/better-auth/auth-client"

export async function ClientSession() {
	const session = await authClient.getSession()

	return (
		<div>
			<p className="text-sm font-medium">Client Session</p>
			<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
		</div>
	)
}
