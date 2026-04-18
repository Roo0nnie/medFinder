"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { cn } from "@/core/lib/utils"
import { useUsersQuery } from "@/features/users/api/users.hooks"

import { useStaffListQuery } from "../api/staff.hooks"

type StaffWithUser = {
	id: string
	userId: string
	department: string
	position: string
	specialization?: string | null
	bio?: string | null
	phone?: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
	userName?: string | null
	email?: string | null
}

interface StaffTableProps {
	onView?: (staff: StaffWithUser) => void
	onEdit?: (staff: StaffWithUser) => void
	onDelete?: (staff: StaffWithUser) => void
	/** Delete several selected rows at once (toolbar + confirm in parent). */
	onDeleteMany?: (staff: StaffWithUser[]) => void
	onAddStaff?: () => void
	/** Increment after deletes so the table clears row selection. */
	selectionClearKey?: number | string
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

export function StaffTable({
	onView,
	onEdit,
	onDelete,
	onDeleteMany,
	onAddStaff,
	selectionClearKey,
}: StaffTableProps) {
	const [pageSize, setPageSize] = useState(10)
	const [pageIndex, setPageIndex] = useState(0)
	const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "all">("active")
	const [search, setSearch] = useState("")
	const [selectedRows, setSelectedRows] = useState<StaffWithUser[]>([])

	const isActiveFilterValue = activeFilter === "all" ? undefined : activeFilter === "active"

	const {
		data: staffResponse,
		isLoading,
		isError,
		error,
	} = useStaffListQuery({
		search: search || undefined,
		limit: pageSize,
		offset: pageIndex * pageSize,
		isActive: isActiveFilterValue,
	})
	const { data: usersData } = useUsersQuery()

	const items: StaffWithUser[] =
		(staffResponse as any)?.data?.map((staff: any) => {
			const user = usersData?.find((u: any) => u.id === staff.userId)
			const userName =
				(user?.firstName || user?.lastName
					? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
					: user?.email) ?? null

			return {
				...staff,
				userName,
				email: user?.email ?? null,
			}
		}) ?? []

	const totalCount = (staffResponse as any)?.count ?? 0

	const columns = useMemo<ColumnDef<StaffWithUser>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={value => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "userName",
				header: ({ column }) => <SortableHeader column={column} label="Name" />,
				cell: ({ row }) => (
					<div className="flex min-w-0 items-center gap-2">
						<span className="min-w-0 truncate font-medium">
							{row.original.userName || row.original.id}
						</span>
						{row.getIsSelected() && onDelete ? (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
								aria-label="Delete staff member"
								onClick={e => {
									e.stopPropagation()
									onDelete(row.original)
								}}
							>
							</Button>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "email",
				header: ({ column }) => <SortableHeader column={column} label="Email" />,
			},
			{
				accessorKey: "department",
				header: ({ column }) => <SortableHeader column={column} label="Department" />,
			},
			{
				accessorKey: "position",
				header: ({ column }) => <SortableHeader column={column} label="Position" />,
			},
			{
				accessorKey: "phone",
				header: ({ column }) => <SortableHeader column={column} label="Phone" />,
			},
			{
				id: "status",
				accessorFn: row => (row.isActive ? 1 : 0),
				header: ({ column }) => <SortableHeader column={column} label="Status" />,
				cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
			},
			{
				id: "actions",
				header: () => (
					<div className="text-right">
						<span className="text-xs font-semibold">Action</span>
					</div>
				),
				enableSorting: false,
				cell: ({ row }) => {
					const staff = row.original
					return (
						<div className="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onView && (
										<DropdownMenuItem onClick={() => onView(staff)}>
											<Eye className="mr-2 h-4 w-4" />
											View details
										</DropdownMenuItem>
									)}
									{onEdit && (
										<DropdownMenuItem onClick={() => onEdit(staff)}>
											<Pencil className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
									)}
									{onDelete && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => onDelete(staff)}
												className="text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[onView, onEdit, onDelete]
	)

	if (isError) {
		console.error("Failed to load staff list:", error)
	}

	const showBulkDelete = Boolean(onDeleteMany && selectedRows.length > 0)
	const toolbarAboveSearch =
		onAddStaff || showBulkDelete ? (
			<div className="flex flex-wrap items-center justify-end gap-2">
				{onAddStaff ? (
					<Button size="sm" className="h-8" onClick={onAddStaff}>
						<Plus className="mr-2 h-4 w-4" />
						Add staff
					</Button>
				) : null}
				{showBulkDelete ? (
					<Button
						variant="destructive"
						size="sm"
						className="h-8"
						onClick={() => onDeleteMany?.(selectedRows)}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete {selectedRows.length}{" "}
						{selectedRows.length === 1 ? "staff member" : "staff members"}
					</Button>
				) : null}
			</div>
		) : null

	const toolbarRight = (
		<Select
			value={activeFilter}
			onValueChange={value => {
				setActiveFilter(value as "active" | "inactive" | "all")
				setPageIndex(0)
			}}
		>
			<SelectTrigger className="h-8 w-full min-w-32 sm:w-40">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="active">Active</SelectItem>
				<SelectItem value="inactive">Inactive</SelectItem>
				<SelectItem value="all">All</SelectItem>
			</SelectContent>
		</Select>
	)

	return (
		<DataTable
			data={items}
			columns={columns}
			toolbarAboveSearch={toolbarAboveSearch}
			toolbarRight={toolbarRight}
			onDebouncedSearchChange={value => {
				setSearch(value)
				setPageIndex(0)
			}}
			isLoading={isLoading}
			errorText={
				isError
					? `Failed to load staff. ${error instanceof Error ? error.message : "Please try again."}`
					: null
			}
			searchPlaceholder="Search staff..."
			manualPagination
			totalCount={totalCount}
			pagination={{
				pageIndex,
				pageSize,
				onPageIndexChange: next => setPageIndex(next),
				onPageSizeChange: next => {
					setPageSize(next)
					setPageIndex(0)
				},
			}}
			getRowId={row => row.id}
			onSelectedRowsChange={setSelectedRows}
			selectionClearKey={selectionClearKey}
		/>
	)
}
