import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/services/better-auth/auth"
import { HomeCtaButton } from "@/features/home/home-cta-button"
import { NavigationLinks } from "@/features/home/navigation-links"

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() })
	const user = session?.user
	const isLoggedIn = !!user

	return (
		<div className="min-h-screen font-sans">
			<nav className="border-border border-b">
				<div className="mx-auto flex max-w-7xl items-center px-8 py-5">
					<Link href="/">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							className="dark:invert"
							src="/next.svg"
							alt="Turbo Template logo"
							width={80}
							height={20}
						/>
					</Link>
				</div>
			</nav>
			<main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-8 py-20">
				<div className="flex w-full flex-col items-center gap-12 text-center">
					<div className="flex flex-col items-center gap-3">
						<p className="text-lg text-zinc-700 md:text-xl dark:text-zinc-300">
							{isLoggedIn ? (
								<>
									Hello <span className="font-semibold">{user?.name ?? user?.email ?? "User"}</span>
								</>
							) : (
								<>
									Welcome <span className="font-semibold">Everyone!</span>
								</>
							)}
						</p>
						<h1 className="text-6xl font-bold tracking-tight text-black md:text-7xl dark:text-zinc-50">
							TURBO TEMPLATE.
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-zinc-600 md:text-2xl dark:text-zinc-400">
							A full-stack monorepo template with Next.js, NestJS, and Flutter. Built for rapid
							development with shared packages, type-safe APIs, and modern tooling.
						</p>
					</div>

					<NavigationLinks />

					<HomeCtaButton href={isLoggedIn ? "/dashboard" : "/login"} isLoggedIn={isLoggedIn} />
				</div>
			</main>
		</div>
	)
}
