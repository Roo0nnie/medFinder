import { redirect } from "next/navigation"

import { CustomerProfileForm } from "@/features/customer/profile/customer-profile-form"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { getCookieHeader } from "@/core/lib/cookie-utils"
import { getSession } from "@/services/better-auth/auth-server"

export default async function OwnerProfilePage() {
	const session = await getSession()

	if (!session?.user) {
		redirect("/login")
	}

	const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
	const sessionUser = session.user as any
	let userPayload = sessionUser

	if (apiBase && sessionUser?.id) {
		try {
			const cookieHeader = await getCookieHeader()
			const res = await fetch(`${apiBase}/v1/users/${encodeURIComponent(String(sessionUser.id))}/`, {
				cache: "no-store",
				...(cookieHeader.length > 0 ? { headers: { cookie: cookieHeader } } : {}),
			})
			if (res.ok) {
				userPayload = await res.json()
			}
		} catch {
			// Fall back to session user
		}
	}

	return (
		<DashboardLayout role="owner">
			<CustomerProfileForm user={userPayload as any} />
		</DashboardLayout>
	)
}
