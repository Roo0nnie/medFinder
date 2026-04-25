"use client"

import {
	BadgeCheck,
	Bell,
	CreditCardIcon,
	LogoutIcon,
	SparklesIcon,
	UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { AuthSession } from "@repo/auth"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/core/components/ui/sidebar"
import { useSignOutMutation } from "@/features/auth/api/session.hooks"
import { getDisplayName, getInitials } from "@/core/lib/utils"

export function NavUser({ session }: { session: AuthSession }) {
	const { isMobile } = useSidebar()
	const signOutMutation = useSignOutMutation()

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage src={session.user?.image ?? undefined} alt={getDisplayName(session.user)} />
							<AvatarFallback className="rounded-lg">
								{getInitials(getDisplayName(session.user)) || "CN"}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{getDisplayName(session.user)}</span>
							<span className="truncate text-xs">{session.user?.email ?? ""}</span>
						</div>
						<HugeiconsIcon icon={UnfoldMoreIcon} className="ml-auto size-4" strokeWidth={2} />
						</SidebarMenuButton>
					</DropdownMenuTrigger>

					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage src={session.user?.image ?? undefined} alt={getDisplayName(session.user)} />
										<AvatarFallback className="rounded-lg">
											{getInitials(getDisplayName(session.user)) || "CN"}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{getDisplayName(session.user)}</span>
										<span className="truncate text-xs">{session.user?.email ?? ""}</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<HugeiconsIcon icon={BadgeCheck} strokeWidth={2} />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem>
								<HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem>
								<HugeiconsIcon icon={Bell} strokeWidth={2} />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => signOutMutation.mutate()}
							disabled={signOutMutation.isPending}
						>
							<HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
							{signOutMutation.isPending ? "Logging out..." : "Log out"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
