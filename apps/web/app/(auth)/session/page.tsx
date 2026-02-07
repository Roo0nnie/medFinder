import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { ClientSession } from "@/features/auth/components/client-session"
import { ServerSession } from "@/features/auth/components/server-session"

export default async function SessionPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Session</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent className="grid grid-cols-2 gap-4">
				<ServerSession />
				<ClientSession />
			</CardContent>
		</Card>
	)
}
