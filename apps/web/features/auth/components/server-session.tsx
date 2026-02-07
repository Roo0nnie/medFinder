import { getSession } from "@/features/auth/api/session.server"

export async function ServerSession() {
	const session = await getSession()

	return (
		<div>
			<p className="text-sm font-medium">Server Session</p>
			<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
		</div>
	)
}
