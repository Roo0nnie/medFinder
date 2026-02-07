import { redirect } from "next/navigation"

import { getSession } from "@/features/auth/api/session.server"
import { RegisterForm } from "@/features/auth/register/components/register-form"

export default async function RegisterPage() {
	const session = await getSession()
	const isLoggedIn = !!session

	if (isLoggedIn) redirect("/")

	return (
		<div className="w-full max-w-sm md:max-w-4xl">
			<RegisterForm />
		</div>
	)
}
