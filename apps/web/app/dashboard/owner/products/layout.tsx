"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { cn } from "@/core/lib/utils"

const tabs = [
	{ href: "/dashboard/owner/products/product", label: "Product" },
	{ href: "/dashboard/owner/products/inventory", label: "Inventory" },
	{ href: "/dashboard/owner/products/category", label: "Category" },
] as const

export default function OwnerProductManagementLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-foreground text-3xl font-bold tracking-tight">Product Management</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Manage product details, inventory records, and product categories from one place.
					</p>
				</div>
				<div className="border-border bg-card inline-flex rounded-lg border p-1">
					{tabs.map(tab => {
						const active = pathname === tab.href
						return (
							<Link
								key={tab.href}
								href={tab.href}
								className={cn(
									"rounded-md px-4 py-2 text-sm font-medium transition-colors",
									active
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{tab.label}
							</Link>
						)
					})}
				</div>
				{children}
			</div>
		</DashboardLayout>
	)
}
