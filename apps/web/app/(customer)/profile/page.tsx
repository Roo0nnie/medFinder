import { getSession } from "@/services/better-auth/auth-server"
import { CustomerProfileForm } from "@/features/customer/profile/customer-profile-form"
import { getCookieHeader } from "@/core/lib/cookie-utils"

export default async function ProfilePage() {
	const session = await getSession()

	if (!session?.user) {
		return null
	}

	const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
	const sessionUser = session.user as any

	// Session payload can be stale after profile updates (Better Auth session snapshot).
	// Fetch the latest user record from the API so the UI reflects persisted changes.
	if (apiBase && sessionUser?.id) {
		try {
			const cookieHeader = await getCookieHeader()
			const res = await fetch(`${apiBase}/v1/users/${encodeURIComponent(String(sessionUser.id))}/`, {
				cache: "no-store",
				...(cookieHeader.length > 0 ? { headers: { cookie: cookieHeader } } : {}),
			})
			if (res.ok) {
				const freshUser = await res.json()
				return <CustomerProfileForm user={freshUser as any} />
			}
		} catch {
			// Fall back to session user below
		}
	}

	return <CustomerProfileForm user={sessionUser as any} />
}

