import { redirect } from "next/navigation"

import { RegisterForm } from "@/features/auth/register/components/register-form"
import { getSession } from "@/features/auth/server/session"

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
