"use client"

import Link from "next/link"
import { ArrowRight01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { buttonVariants } from "@/core/components/ui/button"

interface GetStartedButtonProps {
	href: string
}

export function GetStartedButton({ href }: GetStartedButtonProps) {
	return (
		<Link href={href} className={buttonVariants({ size: "lg" })}>
			<HugeiconsIcon icon={ArrowRight01FreeIcons} strokeWidth={2} className="size-4" />
			Get Started
		</Link>
	)
}
