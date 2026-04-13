"use client"

import { useEffect, useState } from "react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	BadgeCheck,
	HelpCircleIcon,
	LogoutIcon,
	SettingsIcon,
	UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { AuthSession } from "@repo/auth"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { getDisplayName, getInitials } from "@/core/lib/utils"
import { useSignOutMutation } from "@/features/auth/api/session.hooks"

const SECTIONS = [
	{ href: "#home", label: "Home", id: "home" },
	{ href: "#find-product", label: "Products", id: "find-product" },
	{ href: "#pharmacy", label: "Pharmacy", id: "pharmacy" },
	{ href: "#about", label: "About", id: "about" },
	{ href: "#contact", label: "Contact", id: "contact" },
] as const

function scrollToSection(href: string) {
	if (href.startsWith("#")) {
		const id = href.slice(1)
		const el = document.getElementById(id)
		el?.scrollIntoView({ behavior: "smooth", block: "start" })
	}
}

function useActiveSection(isHome: boolean) {
	const [active, setActive] = useState<string | null>(() => (isHome ? "home" : null))

	useEffect(() => {
		if (!isHome) {
			setActive(null)
			return
		}

		setActive("home")

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActive(entry.target.id)
					}
				}
			},
			{ rootMargin: "-20% 0px -70% 0px", threshold: 0 }
		)

		for (const section of SECTIONS) {
			const el = document.getElementById(section.id)
			if (el) observer.observe(el)
		}

		return () => observer.disconnect()
	}, [isHome])

	return active
}

export function LandingNav({ session }: { session: AuthSession | null }) {
	const pathname = usePathname()
	const isHome = pathname === "/"
	const signOutMutation = useSignOutMutation("/")
	const activeSection = useActiveSection(isHome)
	const [mobileOpen, setMobileOpen] = useState(false)

	const logoClass = "flex items-center gap-3"
	const logoInner = (
		<>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src="/assets/MedFinder_logo.svg" alt="MedFinder" width={80} height={20} />
			<span className="text-muted-foreground hidden text-sm font-medium sm:inline">
				MedFinder
			</span>
		</>
	)

	return (
		<>
			{isHome ? (
				<a
					href="#home"
					onClick={e => {
						e.preventDefault()
						scrollToSection("#home")
					}}
					className={logoClass}
				>
					{logoInner}
				</a>
			) : (
				<Link href={"/#home" as Route} className={logoClass}>
					{logoInner}
				</Link>
			)}

			{/* Desktop nav */}
			<div className="text-muted-foreground hidden items-center gap-1 text-sm md:flex">
				{SECTIONS.map(({ href, label, id }) =>
					isHome ? (
						<a
							key={href}
							href={href}
							onClick={e => {
								e.preventDefault()
								scrollToSection(href)
							}}
							className={`relative rounded-md px-3 py-1.5 transition-colors hover:text-foreground ${
								activeSection === id ? "text-foreground font-medium" : ""
							}`}
						>
							{label}
							{activeSection === id ? (
								<span className="bg-primary absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full transition-all" />
							) : null}
						</a>
					) : (
						<Link
							key={href}
							href={`/#${id}` as Route}
							className={`relative rounded-md px-3 py-1.5 transition-colors hover:text-foreground ${
								isHome && activeSection === id ? "text-foreground font-medium" : ""
							}`}
						>
							{label}
							{isHome && activeSection === id ? (
								<span className="bg-primary absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full transition-all" />
							) : null}
						</Link>
					)
				)}
				{session ? (
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button
								variant="ghost"
								className="inline-flex h-9 items-center gap-2 rounded-lg px-2"
							>
								<Avatar className="h-7 w-7 rounded-md">
									<AvatarImage
										src={session.user?.image ?? undefined}
										alt={getDisplayName(session.user)}
									/>
									<AvatarFallback className="rounded-md text-xs">
										{getInitials(getDisplayName(session.user)) || "CN"}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">Menu</span>
								<HugeiconsIcon icon={UnfoldMoreIcon} className="size-4" strokeWidth={2} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-56 rounded-lg">
							<DropdownMenuGroup>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarImage
												src={session.user?.image ?? undefined}
												alt={getDisplayName(session.user)}
											/>
											<AvatarFallback className="rounded-lg">
												{getInitials(getDisplayName(session.user)) || "CN"}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">{getDisplayName(session.user)}</span>
											<span className="text-muted-foreground truncate text-xs">
												{session.user?.email ?? ""}
											</span>
										</div>
									</div>
								</DropdownMenuLabel>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<Link href="#" className="flex items-center">
										<HugeiconsIcon icon={BadgeCheck} className="mr-2 size-4" strokeWidth={2} />
										Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Link href="#" className="flex items-center">
										<HugeiconsIcon icon={SettingsIcon} className="mr-2 size-4" strokeWidth={2} />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Link href="#" className="flex items-center">
										<HugeiconsIcon icon={HelpCircleIcon} className="mr-2 size-4" strokeWidth={2} />
										Help
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => signOutMutation.mutate()}
								disabled={signOutMutation.isPending}
							>
								<HugeiconsIcon icon={LogoutIcon} className="mr-2 size-4" strokeWidth={2} />
								{signOutMutation.isPending ? "Logging out..." : "Log out"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Link
						href="/login"
						className="bg-primary text-primary-foreground hover:bg-primary/80 ml-2 inline-flex h-7 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all hover:scale-105 active:scale-95"
					>
						Login
					</Link>
				)}
			</div>

			{/* Mobile hamburger */}
			<button
				type="button"
				className="md:hidden flex flex-col gap-1.5 p-2"
				aria-label="Toggle navigation menu"
				onClick={() => setMobileOpen(!mobileOpen)}
			>
				<span className={`h-0.5 w-5 bg-foreground rounded transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
				<span className={`h-0.5 w-5 bg-foreground rounded transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
				<span className={`h-0.5 w-5 bg-foreground rounded transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
			</button>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur border-b border-border animate-fade-in-up">
					<div className="flex flex-col gap-1 px-4 py-4">
						{SECTIONS.map(({ href, label, id }) =>
							isHome ? (
								<a
									key={href}
									href={href}
									onClick={e => {
										e.preventDefault()
										scrollToSection(href)
										setMobileOpen(false)
									}}
									className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
										isHome && activeSection === id ? "text-primary font-medium bg-primary/5" : "text-muted-foreground"
									}`}
								>
									{label}
								</a>
							) : (
								<Link
									key={href}
									href={`/#${id}` as Route}
									className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
										isHome && activeSection === id ? "text-primary font-medium bg-primary/5" : "text-muted-foreground"
									}`}
									onClick={() => setMobileOpen(false)}
								>
									{label}
								</Link>
							)
						)}
						{!session && (
							<Link
								href="/login"
								className="bg-primary text-primary-foreground mt-2 rounded-lg px-3 py-2 text-sm font-medium text-center transition-all hover:bg-primary/80"
								onClick={() => setMobileOpen(false)}
							>
								Login
							</Link>
						)}
					</div>
				</div>
			)}
		</>
	)
}
