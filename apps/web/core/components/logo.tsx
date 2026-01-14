"use client"

import Link from "next/link"
import { GitbookFreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "../lib/utils"
import { buttonVariants } from "./ui/button"

interface LogoProps {
	href?: string
	text?: string
	className?: string
}

export function Logo({ href = "/", text = "Turbo Template", className }: LogoProps) {
	return (
		<Link
			href={href}
			className={cn(buttonVariants({ size: "lg", variant: "link" }), "text-foregroundm", className)}
		>
			<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
				<HugeiconsIcon icon={GitbookFreeIcons} strokeWidth={2} className="size-4" />
			</div>
			{text}
		</Link>
	)
}
