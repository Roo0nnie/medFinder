"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package } from "lucide-react"

import BasicAccordion from "@/components/smoothui/basic-accordion"
import { cn } from "@/core/lib/utils"

const BASE = "/dashboard/owner/products"

const subLinks = [
	{ href: `${BASE}/product`, label: "Product" },
	{ href: `${BASE}/category`, label: "Category" },
	{ href: `${BASE}/inventory`, label: "Inventory" },
] as const

interface OwnerProductManagementSidebarProps {
	collapsed?: boolean
}

export function OwnerProductManagementSidebar({ collapsed }: OwnerProductManagementSidebarProps) {
	const pathname = usePathname()
	const isUnderProducts = pathname.startsWith(BASE)
	const defaultExpanded = isUnderProducts ? ["product-mgmt"] : []

	if (collapsed) {
		return (
			<Link
				href={`${BASE}/product`}
				className={cn(
					"group flex items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
					isUnderProducts
						? "bg-primary/10 text-primary"
						: "text-muted-foreground hover:bg-muted hover:text-foreground"
				)}
				title="Product Management"
			>
				<Package
					className={cn(
						"h-5 w-5 shrink-0 transition-colors duration-200",
						isUnderProducts ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
					)}
				/>
			</Link>
		)
	}

	return (
		<BasicAccordion
			key={isUnderProducts ? "products-open" : "products-collapsed"}
			className="border-0 bg-transparent shadow-none divide-y-0"
			contentPaddingClassName="px-2 py-2"
			contentWrapperClassName="border-t-0 bg-transparent"
			defaultExpandedIds={defaultExpanded}
			headerButtonClassName={cn(
				"rounded-lg px-3 py-2.5",
				isUnderProducts && "bg-primary/10"
			)}
			items={[
				{
					id: "product-mgmt",
					title: (
						<span className="flex min-w-0 flex-1 items-center gap-3">
							<Package
								className={cn(
									"h-5 w-5 shrink-0",
									isUnderProducts ? "text-primary" : "text-muted-foreground"
								)}
							/>
							<span
								className={cn(
									"min-w-0 flex-1 leading-snug",
									isUnderProducts ? "text-primary" : "text-muted-foreground"
								)}
							>
								Product Management
							</span>
						</span>
					),
					content: (
						<div className="flex flex-col gap-0.5 pl-2">
							{subLinks.map(link => {
								const active = pathname === link.href
								return (
									<Link
										key={link.href}
										href={link.href}
										className={cn(
											"rounded-md px-3 py-2 text-sm font-medium transition-colors",
											active
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:bg-muted hover:text-foreground"
										)}
									>
										{link.label}
									</Link>
								)
							})}
						</div>
					),
				},
			]}
		/>
	)
}
