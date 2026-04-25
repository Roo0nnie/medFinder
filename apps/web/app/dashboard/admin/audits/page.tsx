"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { CalendarRange, UserCog } from "lucide-react"

import { Card, CardContent } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/core/components/ui/select"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { useAdminAuditsQuery, type AdminAuditEvent } from "@/features/admin/api/admin.hooks"

type RoleFilter = "all" | "owner" | "staff" | "admin" | "customer"
type ActionFilter = "all" | "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT" | "CANCEL"

export default function AdminAuditsPage() {
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
	const [actionFilter, setActionFilter] = useState<ActionFilter>("all")
	const q = useAdminAuditsQuery({
		actorRole: roleFilter === "all" ? undefined : roleFilter,
		action: actionFilter === "all" ? undefined : actionFilter,
		limit: 300,
	})

	const columns = useMemo<ColumnDef<AdminAuditEvent>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Time" />,
				cell: ({ row }) =>
					row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—",
			},
			{
				accessorKey: "actor",
				header: ({ column }) => <SortableHeader column={column} label="Actor" />,
				cell: ({ row }) => (
					<div className="min-w-0">
						<div className="truncate font-medium">{row.original.actor}</div>
						<div className="text-muted-foreground truncate text-xs">
							{row.original.actorRole ? row.original.actorRole : "—"}
						</div>
					</div>
				),
			},
			{
				accessorKey: "action",
				header: ({ column }) => <SortableHeader column={column} label="Action" />,
			},
			{
				id: "resource",
				accessorFn: r => `${r.resourceType}:${r.resourceId ?? "—"}`,
				header: ({ column }) => <SortableHeader column={column} label="Resource" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground font-mono text-xs">
						{row.original.resourceType}:{row.original.resourceId ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "details",
				header: ({ column }) => <SortableHeader column={column} label="Details" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground inline-block max-w-[520px] truncate">
						{row.original.details || "—"}
					</span>
				),
			},
		],
		[]
	)

	const toolbarAboveSearch = (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<Button size="sm" variant="outline" className="h-8" onClick={() => q.refetch()} disabled={q.isFetching}>
				Refresh
			</Button>
		</div>
	)

	const toolbarRight = (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select value={roleFilter} onValueChange={v => setRoleFilter((v ?? "all") as RoleFilter)}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-40">
					<div className="flex min-w-0 items-center gap-2">
						<UserCog className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<span className="truncate">{roleFilter === "all" ? "All roles" : roleFilter}</span>
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All roles</SelectItem>
					<SelectItem value="admin">Admin</SelectItem>
					<SelectItem value="owner">Owner</SelectItem>
					<SelectItem value="staff">Staff</SelectItem>
					<SelectItem value="customer">Customer</SelectItem>
				</SelectContent>
			</Select>
			<Select value={actionFilter} onValueChange={v => setActionFilter((v ?? "all") as ActionFilter)}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<div className="flex min-w-0 items-center gap-2">
						<CalendarRange className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<span className="truncate">{actionFilter === "all" ? "All actions" : actionFilter}</span>
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All actions</SelectItem>
					<SelectItem value="CREATE">CREATE</SelectItem>
					<SelectItem value="UPDATE">UPDATE</SelectItem>
					<SelectItem value="DELETE">DELETE</SelectItem>
					<SelectItem value="LOGIN">LOGIN</SelectItem>
					<SelectItem value="LOGOUT">LOGOUT</SelectItem>
					<SelectItem value="APPROVE">APPROVE</SelectItem>
					<SelectItem value="REJECT">REJECT</SelectItem>
					<SelectItem value="CANCEL">CANCEL</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DashboardLayout role="admin">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
					<p className="mt-2 text-sm text-muted-foreground">Platform-wide curated audit events.</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<DataTable
							data={q.data ?? []}
							columns={columns}
							toolbarAboveSearch={toolbarAboveSearch}
							toolbarRight={toolbarRight}
							isLoading={q.isLoading}
							errorText={q.isError ? "Failed to load audits." : null}
							searchPlaceholder="Search audit logs…"
							getRowId={row => row.id}
						/>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
