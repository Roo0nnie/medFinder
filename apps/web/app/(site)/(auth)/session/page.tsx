import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { getSession } from "@/services/better-auth/auth-server"

export default async function SessionPage() {
	const session = await getSession()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Session</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent>
				<pre>{JSON.stringify(session, null, 2)}</pre>
			</CardContent>
		</Card>
	)
}
