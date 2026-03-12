"use client"

import { useEffect, useMemo, useState } from "react"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
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

export function StaffTable({ onView, onEdit, onDelete }: StaffTableProps) {
	const [sorting, setSorting] = useState<SortingState>([])
	const [rowSelection, setRowSelection] = useState({})
	const [searchInput, setSearchInput] = useState("")
	const [globalFilter, setGlobalFilter] = useState("")
	const [pageSize, setPageSize] = useState(10)
	const [pageIndex, setPageIndex] = useState(0)
	const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "all">("active")

	const isActiveFilterValue = activeFilter === "all" ? undefined : activeFilter === "active"

	const {
		data: staffResponse,
		isLoading,
		isError,
		error,
	} = useStaffListQuery({
		search: globalFilter || undefined,
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
				header: "Name",
				cell: ({ row }) => (
					<span className="font-medium">{row.original.userName || row.original.id}</span>
				),
			},
			{
				accessorKey: "email",
				header: "Email",
			},
			{
				accessorKey: "department",
				header: "Department",
			},
			{
				accessorKey: "position",
				header: "Position",
			},
			{
				accessorKey: "phone",
				header: "Phone",
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
			},
			{
				id: "actions",
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

	const table = useReactTable({
		data: items,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: {
			sorting,
			rowSelection,
			globalFilter,
			pagination: { pageIndex, pageSize },
		},
		manualPagination: true,
		pageCount: Math.ceil(totalCount / pageSize) || 0,
	})

	const pageCount = table.getPageCount()
	const currentPage = pageIndex + 1

	// Debounce the search input so that typing stays responsive
	// while network requests and table filtering are delayed slightly.
	useEffect(() => {
		const timeout = setTimeout(() => {
			setGlobalFilter(searchInput)
		}, 300)

		return () => clearTimeout(timeout)
	}, [searchInput])
	if (isError) {
		console.error("Failed to load staff list:", error)
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Show</span>
					<Select
						value={String(pageSize)}
						onValueChange={value => {
							const next = Number(value)
							setPageSize(next)
							setPageIndex(0)
						}}
					>
						<SelectTrigger className="h-8 w-16">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 20].map(size => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="text-muted-foreground text-sm">entries</span>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
					<Input
						placeholder="Search staff..."
						value={searchInput}
						onChange={e => {
							setSearchInput(e.target.value)
							setPageIndex(0)
						}}
						className="h-8 w-full sm:w-64"
					/>
				</div>
			</div>

			{isLoading && (
				<p className="text-muted-foreground text-xs">Loading staff...</p>
			)}
			{isError && (
				<p className="text-destructive text-sm">
					Failed to load staff. {error instanceof Error ? error.message : "Please try again."}
				</p>
			)}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No staff found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-sm text-pretty">
					{totalCount > 0 ? (
						<>
							Showing {pageIndex * pageSize + 1} to{" "}
							{Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} staff members
						</>
					) : (
						"No staff to display"
					)}
				</p>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => {
							const next = Math.max(pageIndex - 1, 0)
							setPageIndex(next)
						}}
						disabled={pageIndex === 0}
						aria-label="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Previous page</span>
					</Button>
					{Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
						<Button
							key={page}
							variant={currentPage === page ? "default" : "outline"}
							size="icon"
							className="h-8 w-8"
							onClick={() => setPageIndex(page - 1)}
							aria-label={`Go to page ${page}`}
						>
							{page}
						</Button>
					))}
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => {
							const next = Math.min(pageIndex + 1, Math.max(pageCount - 1, 0))
							setPageIndex(next)
						}}
						disabled={pageIndex >= pageCount - 1 || pageCount === 0}
						aria-label="Next page"
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Next page</span>
					</Button>
				</div>
			</div>
		</div>
	)
}
