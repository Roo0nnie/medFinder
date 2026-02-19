import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"

export default async function Home() {
	const session = await getSession()
	if (!session) {
		redirect("/login")
	}
	redirect("/dashboard")
}
