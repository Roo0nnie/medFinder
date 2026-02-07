import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { ClientSession } from "@/features/auth/components/client-session"
import { getSession } from "@/features/auth/server/session"

export default async function SessionPage() {
	const session = await getSession()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Session</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent>
				<div>
					<p className="text-sm font-medium">Server Session</p>
					<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
				</div>
				<ClientSession />
			</CardContent>
		</Card>
	)
}
