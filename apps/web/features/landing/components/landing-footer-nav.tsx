"use client"

import Link from "next/link"

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

export function LandingFooterNav() {
	return (
		<nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
			{SECTIONS.map(({ href, label }) => (
				<a
					key={href}
					href={href}
					onClick={(e) => {
						e.preventDefault()
						scrollToSection(href)
					}}
					className="hover:text-foreground"
				>
					{label}
				</a>
			))}
			<Link href="/login" className="hover:text-foreground">
				Login
			</Link>
		</nav>
	)
}
