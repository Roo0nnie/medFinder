"use client"

import React from "react"
import { LogOut } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { cn } from "@/core/lib/utils"
import { useSignOutMutation } from "@/features/auth/api/session.hooks"

interface DashboardLogoutButtonProps {
	collapsed?: boolean
	redirectTo?: string
}

export function DashboardLogoutButton({
	collapsed,
	redirectTo = "/",
}: DashboardLogoutButtonProps) {
	const signOutMutation = useSignOutMutation(redirectTo)

	return (
		<Button
			variant="ghost"
			size={collapsed ? "icon" : "sm"}
			className={cn(
				"w-full justify-start text-destructive hover:text-destructive",
				!collapsed && "gap-2 px-3"
			)}
			onClick={() => signOutMutation.mutate()}
			disabled={signOutMutation.isPending}
			aria-label="Log out"
		>
			<LogOut className="h-4 w-4" />
			{!collapsed && (
				<span>{signOutMutation.isPending ? "Logging out..." : "Log out"}</span>
			)}
		</Button>
	)
}

