"use client"

import { useMemo } from "react"

import { Badge } from "@/core/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/core/components/ui/sheet"
import { cn } from "@/core/lib/utils"
import { useUsersQuery } from "@/features/users/api/users.hooks"

import { useStaffGetQuery } from "../api/staff.hooks"

interface StaffDetailProps {
	staffId: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

function StatusBadge({ isActive }: { isActive: boolean }) {
	const config = isActive
		? {
				label: "Active",
				className:
					"bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
			}
		: {
				label: "Inactive",
				className: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
			}

	return (
		<Badge variant="outline" className={cn("border-0", config.className)}>
			{config.label}
		</Badge>
	)
}

export function StaffDetail({ staffId, open, onOpenChange }: StaffDetailProps) {
	const {
		data: staff,
		isLoading,
		isError,
	} = useStaffGetQuery(staffId)
	const { data: usersData } = useUsersQuery()

	const user = useMemo(
		() => usersData?.find((u: any) => u.id === (staff as any)?.userId),
		[usersData, staff]
	)

	const userName =
		(user as any)?.firstName || (user as any)?.lastName
			? `${(user as any)?.firstName ?? ""} ${(user as any)?.lastName ?? ""}`.trim()
			: (user as any)?.email

	const email = (user as any)?.email ?? null

	const createdAt =
		(staff as any)?.createdAt
			? new Date((staff as any).createdAt).toLocaleString()
			: "—"

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
			 <SheetHeader>
					<SheetTitle>Staff details</SheetTitle>
					<SheetDescription>
						View full information about this staff member.
					</SheetDescription>
				</SheetHeader>

				<div className="border-border text-foreground flex flex-1 flex-col gap-4 border-t p-4">
					{isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
					{isError && (
						<p className="text-destructive text-sm">
							Failed to load staff details. Please try again.
						</p>
					)}

					{!isLoading && !isError && staff && (
						<dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Name
								</dt>
								<dd className="mt-1 text-sm font-medium">{userName || (staff as any).id}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Email
								</dt>
								<dd className="mt-1 text-sm">{email || "—"}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Department
								</dt>
								<dd className="mt-1 text-sm">{(staff as any).department}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Position
								</dt>
								<dd className="mt-1 text-sm">{(staff as any).position}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Specialization
								</dt>
								<dd className="mt-1 text-sm">{(staff as any).specialization || "—"}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Phone
								</dt>
								<dd className="mt-1 text-sm">{(staff as any).phone || "—"}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Bio
								</dt>
								<dd className="mt-1 text-sm">{(staff as any).bio || "—"}</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Status
								</dt>
								<dd className="mt-1 text-sm">
									<StatusBadge isActive={!!(staff as any).isActive} />
								</dd>
							</div>

							<div>
								<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Created
								</dt>
								<dd className="mt-1 text-sm">{createdAt}</dd>
							</div>
						</dl>
					)}

					{!isLoading && !isError && !staff && (
						<p className="text-muted-foreground text-sm">No staff selected.</p>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}

