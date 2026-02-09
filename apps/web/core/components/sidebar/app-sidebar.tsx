"use client"

import Link from "next/link"

import type { AuthSession } from "@repo/auth"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/core/components/ui/sidebar"

import { LogoIcon } from "../logo"
import { mainNavItems, NavMain } from "./nav-main"
import { demoProjects, NavProjects } from "./nav-projects"
import { NavSecondary, secondaryNavItems } from "./nav-secondary"
import { NavUser } from "./nav-user"

export function AppSidebar({ session }: { session: AuthSession }) {
	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarRail />
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton render={<Link href="/" className="flex items-center gap-2.5" />}>
							<div className="flex shrink-0 items-center justify-center">
								<LogoIcon className="text-foreground" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">Acme Inc</span>
								<span className="text-muted-foreground truncate text-xs">Enterprise</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={mainNavItems} />
				<NavProjects projects={demoProjects} />
				<NavSecondary items={secondaryNavItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser session={session} />
			</SidebarFooter>
		</Sidebar>
	)
}
