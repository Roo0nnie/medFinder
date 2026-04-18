"use client"

import { useMemo } from "react"

import type { User } from "@repo/contracts"

import { Badge } from "@/core/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { Separator } from "@/core/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/core/components/ui/sheet"
import { Skeleton } from "@/core/components/ui/skeleton"
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

function DetailField({
	label,
	children,
	className,
}: {
	label: string
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={cn("min-w-0 space-y-1", className)}>
			<dt className="text-muted-foreground text-xs font-medium leading-none">{label}</dt>
			<dd className="text-foreground text-sm leading-snug wrap-break-word">{children}</dd>
		</div>
	)
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
	return (
		<div className="space-y-0.5">
			<h3 className="text-foreground text-sm font-medium">{title}</h3>
			{description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
		</div>
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
		() => usersData?.find((u: User) => u.id === staff?.userId),
		[usersData, staff]
	)

	const userName =
		user?.firstName || user?.lastName
			? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
			: user?.email

	const displayName = userName || staff?.id || "—"
	const email = user?.email ?? null

	const createdAt = staff?.createdAt ? new Date(staff.createdAt).toLocaleString() : "—"

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
				<SheetHeader className="border-border shrink-0 space-y-1 border-b px-4 pb-4 pt-4">
					<SheetTitle>Staff details</SheetTitle>
					<SheetDescription>View full information about this staff member.</SheetDescription>
				</SheetHeader>

				<ScrollArea className="min-h-0 flex-1">
					<div className="space-y-4 p-4 pb-6">
						{isLoading && (
							<div className="space-y-4" aria-busy="true" aria-label="Loading staff details">
								<div className="space-y-2">
									<Skeleton className="h-7 w-3/5" />
									<Skeleton className="h-4 w-2/5" />
								</div>
								<Skeleton className="h-px w-full" />
								<div className="grid gap-4 sm:grid-cols-2">
									<Skeleton className="h-14 w-full" />
									<Skeleton className="h-14 w-full" />
									<Skeleton className="h-14 w-full sm:col-span-2" />
								</div>
							</div>
						)}

						{isError && (
							<Card className="border-destructive/40 bg-destructive/5">
								<CardContent className="space-y-1 pt-4">
									<p className="text-destructive text-sm font-medium">Couldn&apos;t load details</p>
									<p className="text-muted-foreground text-xs">
										Check your connection and try opening this panel again.
									</p>
								</CardContent>
							</Card>
						)}

						{!isLoading && !isError && staff && (
							<div className="space-y-4">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0 space-y-1">
										<p className="text-foreground text-lg font-semibold leading-tight tracking-tight">
											{displayName}
										</p>
										<p className="text-muted-foreground text-xs">Staff member</p>
									</div>
									<div className="shrink-0 pt-0.5">
										<StatusBadge isActive={staff.isActive} />
									</div>
								</div>

								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<CardTitle className="text-sm">Identity &amp; contact</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 pt-0">
										<dl className="flex flex-col gap-3">
											<DetailField label="Email">{email || "—"}</DetailField>
											<DetailField label="Phone">{staff.phone?.trim() ? staff.phone : "—"}</DetailField>
										</dl>
									</CardContent>
								</Card>

								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<CardTitle className="text-sm">Role &amp; organization</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 pt-0">
										<dl className="flex flex-col gap-3">
											<DetailField label="Department">{staff.department}</DetailField>
											<DetailField label="Position">{staff.position}</DetailField>
											<DetailField label="Specialization">
												{staff.specialization?.trim() ? staff.specialization : "—"}
											</DetailField>
										</dl>
									</CardContent>
								</Card>

								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<SectionHeading
											title="Bio"
											description="Shown on your public profile when applicable."
										/>
									</CardHeader>
									<CardContent className="pt-0">
										<p className="text-foreground text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
											{staff.bio?.trim() ? staff.bio : "—"}
										</p>
									</CardContent>
								</Card>

								<Separator />

								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<CardTitle className="text-sm">Metadata</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<dl>
											<DetailField label="Created">{createdAt}</DetailField>
										</dl>
									</CardContent>
								</Card>
							</div>
						)}

						{!isLoading && !isError && !staff && (
							<Card className="border-dashed">
								<CardContent className="space-y-2 pt-6 text-center">
									<p className="text-foreground text-sm font-medium">No staff selected</p>
									<p className="text-muted-foreground text-xs">
										Choose someone from the list to see their profile here.
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	)
}
