"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CalendarRange, Plus, UserCog } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { useOwnerAuditEventsQuery } from "@/features/dashboard/api/analytics.hooks"
import { cn } from "@/core/lib/utils"
import type { AuditEventItem } from "@repo/contracts"

export type AuditActorRole = "owner" | "staff" | "admin" | "customer"

export type AuditRow = {
	id: string
	createdAt: string
	/** When the audits API is wired, set this so role filtering works. */
	actorRole?: AuditActorRole | null
	actor: string
	action: string
	resource: string
	details: string
}

type PeriodFilter = "all" | "today" | "week" | "month" | "year"
type ActorRoleFilter = "all" | AuditActorRole

function startOfLocalDay(d: Date): number {
	const x = new Date(d)
	x.setHours(0, 0, 0, 0)
	return x.getTime()
}

function startOfIsoWeekMonday(d: Date): number {
	const x = new Date(d)
	const day = (x.getDay() + 6) % 7 // Mon=0 … Sun=6
	x.setDate(x.getDate() - day)
	x.setHours(0, 0, 0, 0)
	return x.getTime()
}

function startOfMonth(d: Date): number {
	const x = new Date(d.getFullYear(), d.getMonth(), 1)
	x.setHours(0, 0, 0, 0)
	return x.getTime()
}

function startOfYear(d: Date): number {
	const x = new Date(d.getFullYear(), 0, 1)
	x.setHours(0, 0, 0, 0)
	return x.getTime()
}

function isCreatedAtInPeriod(createdAt: string, period: PeriodFilter): boolean {
	if (period === "all") return true
	const t = new Date(createdAt).getTime()
	if (Number.isNaN(t)) return false
	const now = new Date()
	switch (period) {
		case "today":
			return t >= startOfLocalDay(now)
		case "week":
			return t >= startOfIsoWeekMonday(now)
		case "month":
			return t >= startOfMonth(now)
		case "year":
			return t >= startOfYear(now)
		default:
			return true
	}
}

function RoleBadge({ role }: { role: AuditActorRole }) {
	const config =
		role === "owner"
			? {
					label: "Owner",
					className:
						"bg-violet-500/15 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300",
				}
			: role === "admin"
				? {
						label: "Admin",
						className: "bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-300",
					}
				: role === "customer"
					? {
							label: "Customer",
							className: "bg-amber-500/15 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200",
						}
					: {
							label: "Staff",
							className: "bg-sky-500/15 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
						}

	return (
		<Badge variant="outline" className={cn("shrink-0 border-0 font-normal", config.className)}>
			{config.label}
		</Badge>
	)
}

export function AuditsTable() {
	const auditQ = useOwnerAuditEventsQuery(300)

	const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
	const [actorRoleFilter, setActorRoleFilter] = useState<ActorRoleFilter>("all")
	const [actionFilter, setActionFilter] = useState<string>("all")

	const rows: AuditRow[] = useMemo(() => {
		const items = auditQ.data?.items ?? []
		return items.map((e: AuditEventItem) => ({
			id: e.id,
			createdAt: e.createdAt,
			actorRole:
				e.actorRole === "owner" ||
				e.actorRole === "staff" ||
				e.actorRole === "admin" ||
				e.actorRole === "customer"
					? e.actorRole
					: undefined,
			actor: e.actor,
			action: e.action,
			resource: e.resource,
			details: e.details,
		}))
	}, [auditQ.data])

	const filtered = useMemo(() => {
		let list = rows
		list = list.filter(r => isCreatedAtInPeriod(r.createdAt, periodFilter))
		if (actorRoleFilter !== "all") {
			list = list.filter(r => (r.actorRole ?? undefined) === actorRoleFilter)
		}
		if (actionFilter !== "all") list = list.filter(r => r.action === actionFilter)
		return list
	}, [rows, periodFilter, actorRoleFilter, actionFilter])

	const columns = useMemo<ColumnDef<AuditRow>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Time" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground text-sm">
						{row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—"}
					</span>
				),
			},
			{
				accessorKey: "actor",
				header: ({ column }) => <SortableHeader column={column} label="Actor" />,
				cell: ({ row }) => {
					const role = row.original.actorRole
					return (
						<div className="flex min-w-0 flex-wrap items-center gap-2">
						
							{role ? <RoleBadge role={role} /> : null}
						</div>
					)
				},
			},
			{
				accessorKey: "action",
				header: ({ column }) => <SortableHeader column={column} label="Action" />,
			},
			
			{
				accessorKey: "details",
				header: ({ column }) => <SortableHeader column={column} label="Details" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground inline-block max-w-[420px] truncate">
						{row.original.details || "—"}
					</span>
				),
			},
		],
		[]
	)

	const toolbarAboveSearch = (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<Button
				size="sm"
				variant="outline"
				className="h-8"
				onClick={() => auditQ.refetch()}
				disabled={auditQ.isFetching}
			>
				<Plus className="mr-2 h-4 w-4" />
				Refresh
			</Button>
		</div>
	)

	const toolbarRight = (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select
				value={periodFilter}
				onValueChange={v => setPeriodFilter((v ?? "all") as PeriodFilter)}
			>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<div className="flex min-w-0 items-center gap-2">
						<CalendarRange className="text-muted-foreground h-4 w-4 shrink-0" />
						<SelectValue />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All time</SelectItem>
					<SelectItem value="today">Today</SelectItem>
					<SelectItem value="week">This week</SelectItem>
					<SelectItem value="month">This month</SelectItem>
					<SelectItem value="year">This year</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={actorRoleFilter}
				onValueChange={v => setActorRoleFilter((v ?? "all") as ActorRoleFilter)}
			>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-40">
					<div className="flex min-w-0 items-center gap-2">
						<UserCog className="text-muted-foreground h-4 w-4 shrink-0" />
						<SelectValue />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All roles</SelectItem>
					<SelectItem value="owner">Owner</SelectItem>
					<SelectItem value="staff">Staff</SelectItem>
					<SelectItem value="admin">Admin</SelectItem>
					<SelectItem value="customer">Customer</SelectItem>
				</SelectContent>
			</Select>

			<Select value={actionFilter} onValueChange={v => setActionFilter(v ?? "all")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-40">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All actions</SelectItem>
					<SelectItem value="CREATE">Create</SelectItem>
					<SelectItem value="UPDATE">Update</SelectItem>
					<SelectItem value="DELETE">Delete</SelectItem>
					<SelectItem value="LOGIN">Login</SelectItem>
					<SelectItem value="LOGOUT">Logout</SelectItem>
					<SelectItem value="APPROVE">Approve</SelectItem>
					<SelectItem value="REJECT">Reject</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	if (auditQ.isLoading) {
		return <div className="text-muted-foreground py-8 text-center text-sm">Loading audit events…</div>
	}

	if (auditQ.error) {
		return (
			<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
				{auditQ.error.message}
			</div>
		)
	}

	return (
		<DataTable
			data={filtered}
			columns={columns}
			toolbarAboveSearch={toolbarAboveSearch}
			toolbarRight={toolbarRight}
			searchPlaceholder="Search audit logs..."
		/>
	)
}
