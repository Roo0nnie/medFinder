"use client"

import Link from "next/link"
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
	{ href: "#home", label: "Home" },
	{ href: "#find-product", label: "Find Product" },
	{ href: "#pharmacy", label: "Pharmacy" },
	{ href: "#about", label: "About" },
	{ href: "#contact", label: "Contact" },
] as const

function scrollToSection(href: string) {
	if (href.startsWith("#")) {
		const id = href.slice(1)
		const el = document.getElementById(id)
		el?.scrollIntoView({ behavior: "smooth", block: "start" })
	}
}

export function LandingNav({ session }: { session: AuthSession | null }) {
	const signOutMutation = useSignOutMutation("/")

	return (
		<>
			<a
				href="#home"
				onClick={e => {
					e.preventDefault()
					scrollToSection("#home")
				}}
				className="flex items-center gap-3"
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/assets/MedFinder_logo.svg" alt="MedFinder" width={80} height={20} />
				<span className="text-muted-foreground hidden text-sm font-medium sm:inline">
					MedFinder
				</span>
			</a>
			<div className="text-muted-foreground hidden items-center gap-4 text-sm md:flex">
				{SECTIONS.map(({ href, label }) => (
					<a
						key={href}
						href={href}
						onClick={e => {
							e.preventDefault()
							scrollToSection(href)
						}}
						className="hover:text-foreground transition-colors"
					>
						{label}
					</a>
				))}
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
						className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-7 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors"
					>
						Login
					</Link>
				)}
			</div>
		</>
	)
}
