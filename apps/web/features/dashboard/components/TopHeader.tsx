"use client"

import React from "react"
import { Bell, PanelLeft, PanelRight, Search, User } from "lucide-react"

import { Button } from "@/core/components/ui/button"

interface TopHeaderProps {
	isSidebarCollapsed: boolean
	onToggleSidebar: () => void
}

export function TopHeader({ isSidebarCollapsed, onToggleSidebar }: TopHeaderProps) {
	return (
		<header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-6 shadow-sm">
			<div className="flex flex-1 items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					className="text-muted-foreground hover:text-foreground"
					onClick={onToggleSidebar}
					aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isSidebarCollapsed ? (
						<PanelRight className="h-5 w-5" />
					) : (
						<PanelLeft className="h-5 w-5" />
					)}
				</Button>
				<div className="relative hidden w-full max-w-md items-center text-muted-foreground focus-within:text-foreground md:flex">
					<Search className="absolute left-3 h-4 w-4" />
					<input
						type="text"
						placeholder="Search..."
						className="h-10 w-full rounded-full border border-input bg-muted pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-background"
					/>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					className="relative text-muted-foreground hover:text-foreground"
				>
					<Bell className="h-5 w-5" />
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
				</Button>
				<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary">
					<User className="h-5 w-5" />
				</div>
			</div>
		</header>
	)
}
