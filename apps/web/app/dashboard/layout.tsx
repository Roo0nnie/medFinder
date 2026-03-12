import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getSession()

	if (!session) {
		redirect("/login")
	}

	return <>{children}</>
}
