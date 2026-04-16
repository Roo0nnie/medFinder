"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Filter, Plus } from "lucide-react"

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
import { useToast } from "@/core/components/ui/use-toast"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"

export type AuditRow = {
	id: string
	createdAt: string
	pharmacyId?: string | null
	actor: string
	action: string
	resource: string
	details: string
}

export function AuditsTable() {
	const { toast } = useToast()
	const { data: pharmacies } = useMyPharmaciesQuery()

	// NOTE: This table is scaffolded for the upcoming audits API hookup.
	const [pharmacyId, setPharmacyId] = useState<string>("")
	const [actionFilter, setActionFilter] = useState<string>("all")

	const rows: AuditRow[] = useMemo(() => [], [])

	const filtered = useMemo(() => {
		let list = rows
		if (pharmacyId) list = list.filter(r => (r.pharmacyId ?? "") === pharmacyId)
		if (actionFilter !== "all") list = list.filter(r => r.action === actionFilter)
		return list
	}, [rows, pharmacyId, actionFilter])

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
				cell: ({ row }) => <span className="font-medium">{row.original.actor}</span>,
			},
			{
				accessorKey: "action",
				header: ({ column }) => <SortableHeader column={column} label="Action" />,
			},
			{
				accessorKey: "resource",
				header: ({ column }) => <SortableHeader column={column} label="Resource" />,
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.resource}</span>,
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

	const toolbarLeft = (
		<Button
			size="sm"
			className="h-8"
			onClick={() => toast({ title: "Coming soon", description: "Audit logging is not connected yet." })}
		>
			<Plus className="mr-2 h-4 w-4" />
			Add audit
		</Button>
	)

	const toolbarRight = (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Filter className="h-4 w-4" />
				<span className="text-xs font-medium">Filters</span>
			</div>
			<Select value={pharmacyId} onValueChange={v => setPharmacyId(v ?? "")}>
				<SelectTrigger className="h-8 w-full sm:w-56">
					<SelectValue placeholder="All pharmacies" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">All pharmacies</SelectItem>
					{pharmacies?.map(ph => (
						<SelectItem key={ph.id} value={ph.id}>
							{ph.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={actionFilter} onValueChange={v => setActionFilter(v)}>
				<SelectTrigger className="h-8 w-full sm:w-48">
					<SelectValue placeholder="All actions" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All actions</SelectItem>
					<SelectItem value="CREATE">Create</SelectItem>
					<SelectItem value="UPDATE">Update</SelectItem>
					<SelectItem value="DELETE">Delete</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DataTable
			data={filtered}
			columns={columns}
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
			searchPlaceholder="Search audit logs..."
		/>
	)
}

