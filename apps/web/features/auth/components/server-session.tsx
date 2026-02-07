import { getSession } from "@/services/better-auth/auth-server"

export async function ServerSession() {
	const session = await getSession()

	return (
		<div className="overflow-x-auto">
			<p className="text-sm font-medium">Server Session</p>
			<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
		</div>
	)
}
