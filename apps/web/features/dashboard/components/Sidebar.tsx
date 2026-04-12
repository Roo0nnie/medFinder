"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
	Activity,
	AlertTriangle,
	BarChart3,
	FileQuestion,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Package,
	Settings,
	Store,
	Tag,
	Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { cn, getDisplayName, getInitials } from "@/core/lib/utils"
import { OwnerProductManagementSidebar } from "@/features/dashboard/components/OwnerProductManagementSidebar"
import { useAuth } from "@/services/better-auth/context/auth-provider"
import { useSignOutMutation } from "@/features/auth/api/session.hooks"

export type Role = "admin" | "owner" | "staff" | "customer"

interface SidebarProps {
	role: Role
	collapsed?: boolean
}

const adminLinks = [
	{ href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/admin/users", label: "User Management", icon: Users },
	{ href: "/dashboard/admin/pharmacies", label: "Pharmacy Management", icon: Store },
	{ href: "/dashboard/admin/products", label: "Product Monitoring", icon: Activity },
	{ href: "/dashboard/admin/brands", label: "Brand catalog", icon: Tag },
	{ href: "/dashboard/admin/reviews", label: "Reviews & Ratings", icon: MessageSquare },
	{ href: "/dashboard/admin/analytics", label: "Reports & Analytics", icon: BarChart3 },
	{ href: "/dashboard/admin/audits", label: "Audit Logs", icon: Activity },
	{ href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
] as const

const ownerLinks = [
	{ href: "/dashboard/owner", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/owner/pharmacies", label: "My Pharmacies", icon: Store },
	{
		href: "/dashboard/owner/products",
		label: "Product Management",
		icon: Package,
		isProductManagementNav: true as const,
	},
	{ href: "/dashboard/owner/staff", label: "Staff Management", icon: Users },
	{ href: "/dashboard/owner/deletion-requests", label: "Deletion Requests", icon: FileQuestion },
	{ href: "/dashboard/owner/reviews", label: "Reviews", icon: MessageSquare },
	{ href: "/dashboard/owner/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/dashboard/owner/audits", label: "Audit Logs", icon: Activity },
	{ href: "/dashboard/owner/settings", label: "Settings", icon: Settings },
] as const

const staffLinks = [
	{ href: "/dashboard/staff", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/staff/products", label: "Products", icon: Package },
	{ href: "/dashboard/staff/stock-alerts", label: "Stock Alerts", icon: AlertTriangle },
	{ href: "/dashboard/staff/reports", label: "Reports", icon: BarChart3 },
	{ href: "/dashboard/staff/audits", label: "Audit Logs", icon: Activity },
	{ href: "/dashboard/staff/settings", label: "Settings", icon: Settings },
] as const

export function Sidebar({ role, collapsed }: SidebarProps) {
	const pathname = usePathname()
	const router = useRouter()
	const signOutMutation = useSignOutMutation("/")
	const { session } = useAuth()

	const user = session?.user as
		| {
				firstName?: string | null
				middleName?: string | null
				lastName?: string | null
				email?: string | null
				name?: string | null
				image?: string | null
		  }
		| undefined

	const firstName = user?.firstName?.trim() || ""
	const middleName = user?.middleName?.trim() || ""
	const lastName = user?.lastName?.trim() || ""
	const fullNameFromParts = [firstName, middleName, lastName].filter(Boolean).join(" ")
	const displayFullName = fullNameFromParts || user?.name?.trim() || ""

	const links =
		role === "admin"
			? adminLinks
			: role === "owner"
				? ownerLinks
				: role === "staff"
					? staffLinks
					: []

	const sidebarWidthClass = collapsed ? "w-16" : "w-64"

	return (
		<aside
			className={cn(
				"border-border bg-card sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r shadow-sm transition-all duration-300",
				sidebarWidthClass
			)}
		>
			<div className="border-border flex h-16 shrink-0 items-center border-b px-6">
				<Link
					href="/"
					className={cn(
						"text-primary flex items-center text-xl font-bold tracking-tight",
						collapsed ? "justify-center" : "gap-2"
					)}
				>
					<Store className="h-6 w-6" />
					{!collapsed && <span className="truncate">MedFinder</span>}
				</Link>
			</div>
			<div className={cn("flex-1 overflow-y-auto py-6", collapsed ? "px-2" : "px-3")}>
				<nav className="space-y-1">
					{links.map(link => {
						if (
							role === "owner" &&
							"isProductManagementNav" in link &&
							link.isProductManagementNav
						) {
							return (
								<OwnerProductManagementSidebar
									key="product-management"
									collapsed={collapsed}
								/>
							)
						}
						const isActive = pathname === link.href
						const Icon = link.icon
						return (
							<Link
								key={link.label}
								href={link.href as any}
								className={cn(
									"group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
									collapsed ? "justify-center px-2" : "gap-3 px-3",
									isActive
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<Icon
									className={cn(
										"h-5 w-5 shrink-0 transition-colors duration-200",
										isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
									)}
								/>
								{!collapsed && <span className="truncate">{link.label}</span>}
							</Link>
						)
					})}
				</nav>
			</div>
			<div className="border-border border-t p-4">
				<div className="flex flex-col gap-3">
					<div
						className={cn(
							"bg-muted flex items-center rounded-lg p-3 text-xs",
							collapsed ? "justify-center" : "gap-3 text-sm"
						)}
					>
						<div className="min-w-0 flex-1">
							<p className="text-foreground truncate font-medium capitalize">{role}</p>
							{!collapsed && (
								<p className="text-muted-foreground truncate text-xs">Dashboard Mode</p>
							)}
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button
								variant="ghost"
								size={collapsed ? "icon" : "sm"}
								className={cn(
									"text-muted-foreground hover:text-foreground w-full justify-start",
									!collapsed && "gap-2 px-3"
								)}
								aria-label="Open account menu"
							>
								<LogOut className="h-4 w-4" />
								{!collapsed && <span>Account</span>}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-1.5 py-1.5 text-xs">
								<div className="flex items-center gap-2">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={user?.image ?? undefined}
											alt={getDisplayName({
												name: displayFullName,
												email: user?.email ?? "",
											})}
										/>
										<AvatarFallback className="rounded-lg text-xs">
											{getInitials(
												getDisplayName({
													name: displayFullName || "User",
													email: user?.email ?? "",
												})
											) || "US"}
										</AvatarFallback>
									</Avatar>
									<div className="flex min-w-0 flex-col">
										<span className="text-foreground truncate text-sm font-medium">
											{displayFullName || "User"}
										</span>
										{(user?.email || "").trim() && (
											<span className="text-muted-foreground truncate text-xs">{user?.email}</span>
										)}
									</div>
								</div>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem onSelect={() => router.push(`/dashboard/${role}/profile` as any)}>
									<span className="text-sm">Profile</span>
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => router.push(`/dashboard/${role}/settings` as any)}>
									<span className="text-sm">Settings</span>
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => router.push(`/dashboard/${role}/help` as any)}>
									<span className="text-sm">Help</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => signOutMutation.mutate()}
								disabled={signOutMutation.isPending}
								className="text-destructive focus:text-destructive"
							>
								<LogOut className="mr-2 h-4 w-4" />
								<span>{signOutMutation.isPending ? "Logging out..." : "Log out"}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</aside>
	)
}
