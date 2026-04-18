"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { DataTable } from "@/core/components/data-table/data-table"
import { SortableHeader } from "@/core/components/data-table/sortable-header"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useToast } from "@/core/components/ui/use-toast"
import {
	useBrandCreateMutation,
	useBrandMineUpdateMutation,
	useBrandUnlinkMutation,
	useBrandsSearchQuery,
	useMyBrandsQuery,
	type Brand,
} from "@/features/brands/api/brands.hooks"

export function OwnerBrandsSection() {
	const { toast } = useToast()
	const mineQuery = useMyBrandsQuery()
	const brandsLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (mineQuery.isError) {
			if (!brandsLoadErrorNotified.current) {
				brandsLoadErrorNotified.current = true
				toast({
					title: "Failed to load brands",
					description: "Could not load your linked brands.",
					variant: "destructive",
				})
			}
		} else {
			brandsLoadErrorNotified.current = false
		}
	}, [mineQuery.isError, toast])

	const createMutation = useBrandCreateMutation()
	const updateMutation = useBrandMineUpdateMutation()
	const unlinkMutation = useBrandUnlinkMutation()

	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [editing, setEditing] = useState<Brand | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)
	const [bulkUnlinkTargets, setBulkUnlinkTargets] = useState<Brand[] | null>(null)
	const [selectedRows, setSelectedRows] = useState<Brand[]>([])
	const [selectionClearKey, setSelectionClearKey] = useState(0)
	const [name, setName] = useState("")
	const [debouncedName, setDebouncedName] = useState("")
	const [brandNameInputFocused, setBrandNameInputFocused] = useState(false)
	const [suggestionPage, setSuggestionPage] = useState(0)
	const brandCreateFieldRef = useRef<HTMLDivElement>(null)

	const SUGGESTIONS_PAGE_SIZE = 5

	const rows = useMemo(() => mineQuery.data ?? [], [mineQuery.data])

	useEffect(() => {
		if (!isCreateOpen) return
		const t = setTimeout(() => setDebouncedName(name), 280)
		return () => clearTimeout(t)
	}, [name, isCreateOpen])

	const brandSearch = useBrandsSearchQuery(
		debouncedName,
		100,
		isCreateOpen && debouncedName.trim().length > 0
	)

	const brandSuggestions = useMemo(() => {
		const hit = brandSearch.data ?? []
		const linked = new Set(rows.map(r => r.id))
		return hit.filter(b => !linked.has(b.id))
	}, [brandSearch.data, rows])

	const suggestionPageCount = Math.max(1, Math.ceil(brandSuggestions.length / SUGGESTIONS_PAGE_SIZE))
	const suggestionPageSafe = Math.min(suggestionPage, suggestionPageCount - 1)
	const pagedBrandSuggestions = useMemo(
		() =>
			brandSuggestions.slice(
				suggestionPageSafe * SUGGESTIONS_PAGE_SIZE,
				suggestionPageSafe * SUGGESTIONS_PAGE_SIZE + SUGGESTIONS_PAGE_SIZE
			),
		[brandSuggestions, suggestionPageSafe]
	)

	useEffect(() => {
		setSuggestionPage(0)
	}, [debouncedName])

	useEffect(() => {
		setSuggestionPage(p => Math.min(p, Math.max(0, suggestionPageCount - 1)))
	}, [suggestionPageCount])

	const openCreate = () => {
		setName("")
		setDebouncedName("")
		setSuggestionPage(0)
		setBrandNameInputFocused(false)
		setIsCreateOpen(true)
	}

	const openEdit = (b: Brand) => {
		setEditing(b)
		setName(b.name ?? "")
		setIsEditOpen(true)
	}

	const submitCreate = async () => {
		const trimmed = name.trim()
		if (!trimmed) {
			toast({ title: "Validation", description: "Brand name is required.", variant: "destructive" })
			return
		}
		try {
			await createMutation.mutateAsync({ name: trimmed })
			toast({ title: "Brand linked" })
			setIsCreateOpen(false)
		} catch (e) {
			toast({
				title: "Create failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const submitEdit = async () => {
		if (!editing) return
		const trimmed = name.trim()
		if (!trimmed) {
			toast({ title: "Validation", description: "Brand name is required.", variant: "destructive" })
			return
		}
		try {
			await updateMutation.mutateAsync({ brandId: editing.id, name: trimmed })
			toast({ title: "Brand updated" })
			setIsEditOpen(false)
		} catch (e) {
			toast({
				title: "Update failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const confirmDelete = async () => {
		if (!deleteTarget) return
		try {
			await unlinkMutation.mutateAsync(deleteTarget.id)
			toast({ title: "Brand unlinked" })
			setDeleteTarget(null)
			setSelectionClearKey(k => k + 1)
		} catch (e) {
			toast({
				title: "Unlink failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const confirmBulkUnlink = async () => {
		if (!bulkUnlinkTargets?.length) return
		try {
			for (const b of bulkUnlinkTargets) {
				await unlinkMutation.mutateAsync(b.id)
			}
			toast({ title: "Brands unlinked" })
			setBulkUnlinkTargets(null)
			setSelectionClearKey(k => k + 1)
		} catch (e) {
			toast({
				title: "Unlink failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const columns: ColumnDef<Brand>[] = useMemo(
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
				accessorKey: "name",
				header: ({ column }) => <SortableHeader column={column} label="Name" />,
				cell: ({ row }) => (
					<div className="flex min-w-0 items-center gap-2">
						<span className="min-w-0 truncate font-medium">{row.original.name}</span>
						{row.getIsSelected() ? (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
								aria-label="Unlink brand"
								onClick={e => {
									e.stopPropagation()
									setDeleteTarget(row.original)
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => <SortableHeader column={column} label="Created" />,
				cell: ({ row }) => {
					const v = row.original.createdAt
					return (
						<span className="text-muted-foreground text-sm tabular-nums whitespace-nowrap">
							{v ? new Date(v).toLocaleDateString() : "—"}
						</span>
					)
				},
			},
			{
				accessorKey: "updatedAt",
				header: ({ column }) => <SortableHeader column={column} label="Last updated" />,
				cell: ({ row }) => {
					const v = row.original.updatedAt
					return (
						<span className="text-muted-foreground text-sm tabular-nums whitespace-nowrap">
							{v ? new Date(v).toLocaleDateString() : "—"}
						</span>
					)
				},
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
					const b = row.original
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
									<DropdownMenuItem onClick={() => openEdit(b)}>
										<Pencil className="mr-2 h-4 w-4" />
										Rename / reassign
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setDeleteTarget(b)} className="text-destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Unlink
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[]
	)

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold">Brands</h2>
					<p className="text-muted-foreground text-sm">
						Link global brands to your account, then pick them on products.
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-2">
					<Button onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add brand
					</Button>
					{selectedRows.length > 0 ? (
						<Button
							type="button"
							variant="destructive"
							size="sm"
							className="h-9"
							onClick={() => setBulkUnlinkTargets(selectedRows)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Unlink {selectedRows.length}{" "}
							{selectedRows.length === 1 ? "Brand" : "Brands"}
						</Button>
					) : null}
				</div>
			</div>

			<div className="mt-4">
				<DataTable
					data={rows}
					columns={columns}
					isLoading={mineQuery.isLoading}
					errorText={mineQuery.isError ? "Failed to load brands." : null}
					searchPlaceholder="Search brands…"
					getRowId={row => row.id}
					onSelectedRowsChange={setSelectedRows}
					selectionClearKey={selectionClearKey}
				/>
			</div>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add brand</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="brand-create-name">Name</Label>
						<div className="relative" ref={brandCreateFieldRef}>
							<Input
								id="brand-create-name"
								value={name}
								onChange={e => setName(e.target.value)}
								onFocus={() => setBrandNameInputFocused(true)}
								onBlur={e => {
									const next = e.relatedTarget as Node | null
									if (next && brandCreateFieldRef.current?.contains(next)) return
									setBrandNameInputFocused(false)
								}}
								placeholder="e.g. Generic Pharma"
								autoComplete="off"
								aria-autocomplete="list"
								aria-controls="brand-create-suggestions"
								aria-expanded={
									isCreateOpen && brandNameInputFocused && debouncedName.trim().length > 0
								}
							/>
							{isCreateOpen &&
								brandNameInputFocused &&
								debouncedName.trim().length > 0 && (
									<div
										id="brand-create-suggestions"
										role="listbox"
										className="bg-popover text-popover-foreground border-border absolute z-50 mt-1 w-full rounded-md border py-1 shadow-md"
									>
										{brandSearch.isFetching && (
											<p className="text-muted-foreground px-3 py-2 text-sm">Searching catalog…</p>
										)}
										{!brandSearch.isFetching && brandSuggestions.length === 0 && (
											<p className="text-muted-foreground px-3 py-2 text-sm">
												{(brandSearch.data ?? []).length > 0
													? "Matching brands are already linked to your account."
													: "No matching brands in the catalog."}
											</p>
										)}
										{!brandSearch.isFetching && brandSuggestions.length > 0 && (
											<>
												<ul className="max-h-50 overflow-auto py-0.5">
													{pagedBrandSuggestions.map(b => (
														<li key={b.id} role="option">
															<button
																type="button"
																className="hover:bg-accent focus:bg-accent w-full px-3 py-2 text-left text-sm outline-none"
																onMouseDown={e => e.preventDefault()}
																onClick={() => {
																	setName(b.name)
																	setSuggestionPage(0)
																}}
															>
																{b.name}
															</button>
														</li>
													))}
												</ul>
												{suggestionPageCount > 1 && (
													<div className="border-border flex items-center justify-between gap-2 border-t px-2 py-1.5">
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8 shrink-0"
															disabled={suggestionPageSafe <= 0}
															aria-label="Previous suggestions"
															onMouseDown={e => e.preventDefault()}
															onClick={() => setSuggestionPage(p => Math.max(0, p - 1))}
														>
															<ChevronLeft className="h-4 w-4" />
														</Button>
														<span className="text-muted-foreground text-xs tabular-nums">
															{suggestionPageSafe + 1} / {suggestionPageCount}
														</span>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8 shrink-0"
															disabled={suggestionPageSafe >= suggestionPageCount - 1}
															aria-label="Next suggestions"
															onMouseDown={e => e.preventDefault()}
															onClick={() =>
																setSuggestionPage(p =>
																	Math.min(suggestionPageCount - 1, p + 1)
																)
															}
														>
															<ChevronRight className="h-4 w-4" />
														</Button>
													</div>
												)}
											</>
										)}
									</div>
								)}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => void submitCreate()}>Create &amp; link</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update brand</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="brand-edit-name">Name</Label>
						<Input id="brand-edit-name" value={name} onChange={e => setName(e.target.value)} />
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => void submitEdit()}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Unlink brand?</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						This removes the brand from your list. You can only unlink if no products in your pharmacies
						still use it.
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => void confirmDelete()}>
							Unlink
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!bulkUnlinkTargets?.length} onOpenChange={open => !open && setBulkUnlinkTargets(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Unlink {bulkUnlinkTargets?.length ?? 0} brands?</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						This removes the selected brands from your list. You can only unlink if no products still use
						each brand.
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBulkUnlinkTargets(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => void confirmBulkUnlink()}>
							Unlink all
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
