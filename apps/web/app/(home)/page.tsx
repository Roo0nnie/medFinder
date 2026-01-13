"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoginSquare01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { signOut, useSession } from "@/services/better-auth/auth-client"
import { NavigationLinks } from "@/features/home/navigation-links"

export default function Home() {
	const router = useRouter()
	const session = useSession()
	const isLoggedIn = !!session.data?.user
	const isLoading = session.isPending

	const handleLogin = () => {
		router.push("/login")
	}

	const handleLogout = async () => {
		await signOut()
	}

	return (
		<div className="min-h-screen font-sans">
			<nav className="border-border border-b">
				<div className="mx-auto flex max-w-7xl items-center px-8 py-5">
					<Link href="/">
						<Image
							className="dark:invert"
							src="/next.svg"
							alt="Turbo Template logo"
							width={80}
							height={20}
							priority
						/>
					</Link>
				</div>
			</nav>
			<main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-8 py-20">
				<div className="flex w-full flex-col items-center gap-12 text-center">
					<div className="flex flex-col items-center gap-6">
						<h1 className="text-6xl font-bold tracking-tight text-black md:text-7xl dark:text-zinc-50">
							TURBO TEMPLATE.
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-zinc-600 md:text-2xl dark:text-zinc-400">
							A full-stack monorepo template with Next.js, NestJS, and Flutter. Built for rapid
							development with shared packages, type-safe APIs, and modern tooling.
						</p>
					</div>

					<NavigationLinks />

					{!isLoading && (
						<div className="pt-4">
							{!isLoggedIn ? (
								<button
									onClick={handleLogin}
									className="flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
								>
									<HugeiconsIcon
										icon={LoginSquare01FreeIcons}
										strokeWidth={2}
										className="pointer-events-none shrink-0"
									/>
									Login
								</button>
							) : (
								<button
									onClick={handleLogout}
									className="flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
								>
									Logout
								</button>
							)}
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
