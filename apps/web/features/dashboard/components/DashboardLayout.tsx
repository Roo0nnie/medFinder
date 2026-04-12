"use client"

import React, { useState } from "react"

import { DashboardShellHeader } from "@/core/components/sidebar/dashboard-shell-header"

import type { Role } from "./Sidebar"
import { Sidebar } from "./Sidebar"

function dashboardRootForRole(role: Role): { rootLabel: string; rootHref: string } {
	switch (role) {
		case "admin":
			return { rootLabel: "Admin", rootHref: "/dashboard/admin" }
		case "owner":
			return { rootLabel: "Owner", rootHref: "/dashboard/owner" }
		case "staff":
			return { rootLabel: "Staff", rootHref: "/dashboard/staff" }
		default:
			return { rootLabel: "Dashboard", rootHref: "/dashboard" }
	}
}

interface DashboardLayoutProps {
	children: React.ReactNode
	role: Role
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
	const { rootLabel, rootHref } = dashboardRootForRole(role)

	return (
		<div className="bg-background flex h-screen overflow-hidden font-sans">
			<Sidebar role={role} collapsed={isSidebarCollapsed} />
			<div className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
				<DashboardShellHeader
					rootLabel={rootLabel}
					rootHref={rootHref}
					isSidebarCollapsed={isSidebarCollapsed}
					onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
				/>
				<main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
					<div className="animate-in fade-in zoom-in-95 isolate overflow-hidden duration-500">
						{children}
					</div>
				</main>
			</div>
		</div>
	)
}
