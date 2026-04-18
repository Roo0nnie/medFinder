"use client"

import Link from "next/link"
import {
	BarChart3,
	FileQuestion,
	MessageSquare,
	Package,
	Store,
	Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"

const links = [
	{ href: "/dashboard/owner/pharmacies", label: "My pharmacies", icon: Store },
	{ href: "/dashboard/owner/products", label: "Product management", icon: Package },
	{ href: "/dashboard/owner/staff", label: "Staff", icon: Users },
	{ href: "/dashboard/owner/reviews", label: "Reviews", icon: MessageSquare },
	{ href: "/dashboard/owner/deletion-requests", label: "Deletion requests", icon: FileQuestion },
	{ href: "/dashboard/owner/analytics", label: "Analytics", icon: BarChart3 },
] as const

export function OwnerDashboardQuickLinks() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Shortcuts</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{links.map(({ href, label, icon: Icon }) => (
						<li key={href}>
							<Link
								href={href}
								className="text-foreground hover:bg-muted/80 flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-border"
							>
								<Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
								{label}
							</Link>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	)
}
