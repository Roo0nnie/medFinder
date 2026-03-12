"use client"

import React, { useState } from "react"

import type { Role } from "./Sidebar"
import { Sidebar } from "./Sidebar"
import { TopHeader } from "./TopHeader"

interface DashboardLayoutProps {
	children: React.ReactNode
	role: Role
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

	return (
		<div className="bg-background flex h-screen overflow-hidden font-sans">
			<Sidebar role={role} collapsed={isSidebarCollapsed} />
			<div className="flex flex-1 flex-col overflow-hidden">
				<TopHeader
					isSidebarCollapsed={isSidebarCollapsed}
					onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
				/>
				<main className="flex-1 overflow-y-auto p-6 lg:p-8">
					<div className="animate-in fade-in zoom-in-95 mx-auto max-w-7xl duration-500">
						{children}
					</div>
				</main>
			</div>
		</div>
	)
}
