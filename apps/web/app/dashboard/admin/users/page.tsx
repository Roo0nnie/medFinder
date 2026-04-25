"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, MoreHorizontal, Pencil, Store, UserCog, Users } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/core/components/ui/sheet"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { Separator } from "@/core/components/ui/separator"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/core/components/ui/select"
import { env } from "@/env"
import { cn } from "@/core/lib/utils"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import {
	useAdminPharmaciesQuery,
	useAdminUsersQuery,
	type AdminPharmacyRow,
	type AdminUserRow,
} from "@/features/admin/api/admin.hooks"

type UserStatus = "active" | "inactive"

function displayValue(value: unknown) {
	if (value === null || value === undefined) return "N/A"
	if (typeof value === "string") return value.trim() ? value : "N/A"
	return String(value)
}

function formatDate(value?: string | null) {
	if (!value) return "N/A"
	const dt = new Date(value)
	if (Number.isNaN(dt.getTime())) return "N/A"
	return dt.toLocaleString()
}

function getBaseUrl() {
	return (typeof window !== "undefined" ? env.NEXT_PUBLIC_API_BASE_URL : env.NEXT_PUBLIC_API_BASE_URL) ?? ""
}

async function deleteUser(userId: string) {
	const base = getBaseUrl().replace(/\/$/, "")
	const res = await fetch(`${base}/v1/users/${userId}/`, {
		method: "DELETE",
		credentials: "include",
	})
	if (!res.ok) {
		const text = await res.text().catch(() => "")
		throw new Error(text || "Failed to delete user.")
	}
	return res.json().catch(() => ({}))
}

export default function AdminUsersPage() {
	const router = useRouter()
	const q = useAdminUsersQuery()
	const pharmaciesQ = useAdminPharmaciesQuery()

	const [roleFilter, setRoleFilter] = useState<string>("all")
	const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all")
	const [pharmacyFilter, setPharmacyFilter] = useState<string>("all")
	const [statusByUserId, setStatusByUserId] = useState<Record<string, UserStatus>>({})
	const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
	const [isViewOpen, setIsViewOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const pharmacies = pharmaciesQ.data ?? []
	const pharmacyOptions = useMemo(() => {
		const items = pharmacies
			.map((p: AdminPharmacyRow) => ({ id: p.id, label: p.name, ownerId: p.ownerId }))
			.sort((a, b) => a.label.localeCompare(b.label))
		return items
	}, [pharmacies])

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem("admin.users.statusByUserId")
			if (!raw) return
			const parsed = JSON.parse(raw) as Record<string, UserStatus>
			if (parsed && typeof parsed === "object") setStatusByUserId(parsed)
		} catch {
			// ignore
		}
	}, [])

	useEffect(() => {
		try {
			window.localStorage.setItem("admin.users.statusByUserId", JSON.stringify(statusByUserId))
		} catch {
			// ignore
		}
	}, [statusByUserId])

	const filteredRows = useMemo(() => {
		let rows = q.data ?? []
		if (roleFilter !== "all") rows = rows.filter(u => u.role === roleFilter)
		if (verifiedFilter !== "all") {
			rows = rows.filter(u => (verifiedFilter === "verified" ? u.emailVerified : !u.emailVerified))
		}
		if (pharmacyFilter !== "all") {
			const ph = pharmacies.find(p => p.id === pharmacyFilter)
			const ownerId = ph?.ownerId
			rows = ownerId ? rows.filter(u => u.id === ownerId) : []
		}
		return rows
	}, [q.data, roleFilter, verifiedFilter, pharmacyFilter, pharmacies])

	function RoleBadge({ role }: { role: string }) {
		const r = (role || "").toLowerCase()
		const cfg =
			r === "admin"
				? { label: "Admin", cls: "bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-300" }
				: r === "owner"
					? { label: "Owner", cls: "bg-violet-500/15 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300" }
					: r === "staff"
						? { label: "Staff", cls: "bg-sky-500/15 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300" }
						: { label: "Customer", cls: "bg-amber-500/15 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200" }

		return (
			<Badge variant="outline" className={cn("border-0 font-normal", cfg.cls)}>
				{cfg.label}
			</Badge>
		)
	}

	function StatusBadge({ status }: { status: UserStatus }) {
		const config =
			status === "active"
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

	function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
		return (
			<div className="min-w-0 space-y-1">
				<div className="text-muted-foreground text-xs font-medium leading-none">{label}</div>
				<div className="text-foreground text-sm leading-snug wrap-break-word">{value}</div>
			</div>
		)
	}

	const columns = useMemo<ColumnDef<AdminUserRow>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Name" />,
				cell: ({ row }) => <div className="truncate font-medium text-foreground">{row.original.name}</div>,
			},
			{
				accessorKey: "email",
				header: ({ column }) => <SortableHeader column={column} label="Email" />,
				cell: ({ row }) => <div className="truncate text-sm text-muted-foreground">{row.original.email}</div>,
			},
			{
				accessorKey: "role",
				header: ({ column }) => <SortableHeader column={column} label="Role" />,
				cell: ({ row }) => <RoleBadge role={row.original.role} />,
			},
			{
				id: "status",
				header: ({ column }) => <SortableHeader column={column} label="Status" />,
				accessorFn: row => statusByUserId[row.id] ?? "active",
				cell: ({ row }) => {
					const status = statusByUserId[row.original.id] ?? "active"
					return (
						<Badge
							variant="outline"
							className={cn(
								"border-0 font-normal",
								status === "active"
									? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
									: "bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-300"
							)}
						>
							{status === "active" ? "Active" : "Inactive"}
						</Badge>
					)
				},
			},
			{
				accessorKey: "emailVerified",
				header: ({ column }) => <SortableHeader column={column} label="Verified" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground text-sm">{row.original.emailVerified ? "Verified" : "N/A"}</span>
				),
			},
			{
				accessorKey: "updatedAt",
				header: ({ column }) => <SortableHeader column={column} label="Updated" />,
				cell: ({ row }) => formatDate(row.original.updatedAt),
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
					const u = row.original
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
									<DropdownMenuItem
										onClick={() => {
											setSelectedUser(u)
											setIsViewOpen(true)
										}}
									>
										<Eye className="mr-2 h-4 w-4" />
										View
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setStatusByUserId(prev => ({ ...prev, [u.id]: "inactive" }))
											setSelectedUser(u)
											setIsViewOpen(true)
										}}
									>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[statusByUserId]
	)

	const toolbarRight = (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Select value={roleFilter} onValueChange={v => setRoleFilter(v ?? "all")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<div className="flex min-w-0 items-center gap-2">
						<Users className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
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

			<Select value={verifiedFilter} onValueChange={v => setVerifiedFilter((v ?? "all") as any)}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-44">
					<div className="flex min-w-0 items-center gap-2">
						<UserCog className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<span className="truncate">
							{verifiedFilter === "all"
								? "All verification"
								: verifiedFilter === "verified"
									? "Verified"
									: "Unverified"}
						</span>
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All verification</SelectItem>
					<SelectItem value="verified">Verified</SelectItem>
					<SelectItem value="unverified">Unverified</SelectItem>
				</SelectContent>
			</Select>

			<Select value={pharmacyFilter} onValueChange={v => setPharmacyFilter(v ?? "all")}>
				<SelectTrigger className="h-8 w-full min-w-40 sm:w-56">
					<div className="flex min-w-0 items-center gap-2">
						<Store className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
						<span className="truncate">
							{pharmacyFilter === "all"
								? "All pharmacies"
								: pharmacyOptions.find(p => p.id === pharmacyFilter)?.label ?? "Pharmacy"}
						</span>
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All pharmacies</SelectItem>
					{pharmacyOptions.map(p => (
						<SelectItem key={p.id} value={p.id}>
							{p.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Platform-wide user monitoring. Use filters to narrow by role, verification, or pharmacy ownership.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<DataTable
							data={filteredRows}
							columns={columns}
							toolbarRight={toolbarRight}
							isLoading={q.isLoading}
							errorText={q.isError ? "Failed to load users." : null}
							searchPlaceholder="Search users…"
							getRowId={row => row.id}
						/>
					</CardContent>
				</Card>
			</div>

			<Sheet open={isViewOpen} onOpenChange={open => setIsViewOpen(open)}>
				<SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
					<SheetHeader className="border-border shrink-0 space-y-1 border-b px-4 pb-4 pt-4">
						<SheetTitle>User details</SheetTitle>
						<SheetDescription>View full information about this user.</SheetDescription>
					</SheetHeader>

					<ScrollArea className="min-h-0 flex-1">
						<div className="space-y-4 p-4 pb-6">
							{selectedUser ? (
								<div className="space-y-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="min-w-0 space-y-1">
											<p className="text-foreground text-lg font-semibold leading-tight tracking-tight">
												{displayValue(selectedUser.name)}
											</p>
											<p className="text-muted-foreground text-xs">{displayValue(selectedUser.email)}</p>
										</div>
										<div className="shrink-0 pt-0.5">
											<StatusBadge status={statusByUserId[selectedUser.id] ?? "active"} />
										</div>
									</div>

									<Card className="shadow-none">
										<CardHeader className="pb-3">
											<CardTitle className="text-sm">Identity &amp; contact</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3 pt-0">
											<dl className="grid gap-3 sm:grid-cols-2">
												<DetailField label="Email" value={displayValue(selectedUser.email)} />
												<DetailField label="Phone" value={displayValue(selectedUser.phone)} />
												<DetailField
													label="Email verified"
													value={selectedUser.emailVerified ? "Verified" : "N/A"}
												/>
												<DetailField label="User ID" value={displayValue(selectedUser.id)} />
											</dl>
										</CardContent>
									</Card>

									<Card className="shadow-none">
										<CardHeader className="pb-3">
											<CardTitle className="text-sm">Role &amp; activity</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3 pt-0">
											<dl className="grid gap-3 sm:grid-cols-2">
												<DetailField label="Role" value={<RoleBadge role={selectedUser.role} />} />
												<DetailField
													label="Status"
													value={<span className="capitalize">{statusByUserId[selectedUser.id] ?? "active"}</span>}
												/>
												<DetailField label="Owned pharmacies" value={displayValue(selectedUser.ownedPharmaciesCount)} />
												<DetailField label="Staff assignments" value={displayValue(selectedUser.staffAssignmentsCount)} />
												<DetailField label="Reservations" value={displayValue(selectedUser.reservationsCount)} />
											</dl>
										</CardContent>
									</Card>

									<Separator />

									<Card className="shadow-none">
										<CardHeader className="pb-3">
											<CardTitle className="text-sm">Metadata</CardTitle>
										</CardHeader>
										<CardContent className="pt-0">
											<dl className="grid gap-3 sm:grid-cols-2">
												<DetailField label="Created" value={formatDate(selectedUser.createdAt)} />
												<DetailField label="Updated" value={formatDate(selectedUser.updatedAt)} />
											</dl>
										</CardContent>
									</Card>
								</div>
							) : (
								<Card className="border-dashed shadow-none">
									<CardContent className="space-y-2 pt-6 text-center">
										<p className="text-foreground text-sm font-medium">No user selected</p>
										<p className="text-muted-foreground text-xs">Choose a row and click View.</p>
									</CardContent>
								</Card>
							)}
						</div>
					</ScrollArea>

					<SheetFooter className="gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="destructive"
							disabled={!selectedUser || isDeleting}
							onClick={async () => {
								if (!selectedUser) return
								const ok = window.confirm(`Delete ${selectedUser.name}? This cannot be undone.`)
								if (!ok) return
								setIsDeleting(true)
								try {
									await deleteUser(selectedUser.id)
									setIsViewOpen(false)
									setSelectedUser(null)
									q.refetch()
								} catch (e) {
									window.alert(e instanceof Error ? e.message : "Failed to delete user.")
								} finally {
									setIsDeleting(false)
								}
							}}
						>
							{isDeleting ? "Deleting…" : "Delete"}
						</Button>
						<Button
							variant="secondary"
							disabled={!selectedUser}
							onClick={() => {
								if (!selectedUser) return
								setStatusByUserId(prev => ({ ...prev, [selectedUser.id]: "inactive" }))
							}}
						>
							Set inactive
						</Button>
						<Button onClick={() => setIsViewOpen(false)}>Close</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</DashboardLayout>
	)
}

