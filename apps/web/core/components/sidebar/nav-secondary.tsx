"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { HelpCircleIcon, SettingsIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/core/components/ui/sidebar"

interface NavSecondaryItem {
	title: string
	url: string
	icon: IconSvgElement
}

export function NavSecondary({ items }: { items: NavSecondaryItem[] }) {
	const pathname = usePathname()

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map(item => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton isActive={pathname === item.url} tooltip={item.title}>
								<HugeiconsIcon icon={item.icon} strokeWidth={2} />
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}

export const secondaryNavItems: NavSecondaryItem[] = [
	{
		title: "Settings",
		url: "/settings",
		icon: SettingsIcon,
	},
	{
		title: "Help",
		url: "/help",
		icon: HelpCircleIcon,
	},
]
