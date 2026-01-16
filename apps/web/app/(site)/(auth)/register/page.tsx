import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/services/better-auth/auth"
import { RegisterForm } from "@/features/auth/register/components/register-form"

export default async function RegisterPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	const isLoggedIn = !!session?.user

	if (isLoggedIn) redirect("/")

	return (
		<div className="w-full max-w-sm md:max-w-4xl">
			<RegisterForm />
		</div>
	)
}
