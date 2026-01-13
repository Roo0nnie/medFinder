import Link from "next/link"
import { GitbookFreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface LogoProps {
	href?: string
	text?: string
	className?: string
}

export function Logo({ href = "/", text = "Turbo Template", className }: LogoProps) {
	return (
		<Link href={href} className={`flex items-center gap-2 font-medium ${className ?? ""}`}>
			<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
				<HugeiconsIcon icon={GitbookFreeIcons} strokeWidth={2} className="size-4" />
			</div>
			{text}
		</Link>
	)
}
