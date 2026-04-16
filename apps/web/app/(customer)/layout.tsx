import { redirect } from "next/navigation"

import { LandingNav } from "@/features/landing/components/landing-nav"
import { getSession } from "@/services/better-auth/auth-server"

const DASHBOARD_ROLES = ["admin", "owner", "staff"] as const

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession()
	if (!session) {
		redirect("/login")
	}

	const role = (session.user as { role?: string } | undefined)?.role
	if (role && DASHBOARD_ROLES.includes(role as (typeof DASHBOARD_ROLES)[number])) {
		redirect("/dashboard")
	}

	return (
		<div className="min-h-screen font-sans">
			<nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-8">
					<LandingNav session={session} />
				</div>
			</nav>
			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">{children}</main>
		</div>
	)
}

