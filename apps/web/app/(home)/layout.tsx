import { getSession } from "@/services/better-auth/auth-server"
import { LandingNav } from "@/features/landing/components/landing-nav"

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession()
	return (
		<div className="min-h-screen font-sans">
			<nav
				data-site-nav
				className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
			>
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-8">
					<LandingNav session={session} />
				</div>
			</nav>
			<main className="flex w-full flex-col">{children}</main>
		</div>
	)
}
