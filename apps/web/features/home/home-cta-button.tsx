"use client"

import type { Route } from "next"
import Link from "next/link"
import { ArrowRight01FreeIcons, Logout01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/core/components/ui/button"
import { buttonVariants } from "@/core/components/ui/button-variants"
import { useSignOutMutation } from "@/features/auth/api/session.hooks"

interface HomeCtaButtonProps {
	href: string
	isLoggedIn: boolean
}

export function HomeCtaButton({ href, isLoggedIn }: HomeCtaButtonProps) {
	const signOutMutation = useSignOutMutation()

	if (isLoggedIn) {
		return (
			<Button
				size="lg"
				onClick={() => signOutMutation.mutate()}
				disabled={signOutMutation.isPending}
			>
				<HugeiconsIcon icon={Logout01FreeIcons} strokeWidth={2} className="size-4" />
				{signOutMutation.isPending ? "Logging out..." : "Logout"}
			</Button>
		)
	}

	return (
		<Link href={href as Route} className={buttonVariants({ size: "lg" })}>
			<HugeiconsIcon icon={ArrowRight01FreeIcons} strokeWidth={2} className="size-4" />
			Login
		</Link>
	)
}
