import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"
import { LoginForm } from "@/features/auth/login/components/login-form"

export default async function LoginPage() {
	const session = await getSession()
	const isLoggedIn = !!session

	if (isLoggedIn) redirect("/")

	return (
		<div className="w-full max-w-sm md:max-w-4xl">
			<LoginForm />
		</div>
	)
}
