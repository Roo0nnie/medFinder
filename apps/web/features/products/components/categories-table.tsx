"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

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
	useCategoryCreateMutation,
	useCategoryDeleteMutation,
	useCategoryUpdateMutation,
	useProductCategoriesQuery,
	type ProductCategory,
} from "@/features/products/api/products.hooks"

export type CategoryRow = ProductCategory & {
	parentName?: string
}

export type CategoriesTableHandle = {
	openCreate: () => void
	/** Opens bulk-delete confirmation when there is a selection. */
	requestBulkDelete: () => void
}

export type CategoriesTableProps = {
	onSelectionChange?: (rows: CategoryRow[]) => void
}

export const CategoriesTable = forwardRef<CategoriesTableHandle, CategoriesTableProps>(
	function CategoriesTable({ onSelectionChange }, ref) {
	const { toast } = useToast()

	const categoriesQuery = useProductCategoriesQuery()
	const categoriesLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (categoriesQuery.isError) {
			if (!categoriesLoadErrorNotified.current) {
				categoriesLoadErrorNotified.current = true
				toast({
					title: "Failed to load categories",
					description: "Could not load categories from the API.",
					variant: "destructive",
				})
			}
		} else {
			categoriesLoadErrorNotified.current = false
		}
	}, [categoriesQuery.isError, toast])

	const createMutation = useCategoryCreateMutation()
	const updateMutation = useCategoryUpdateMutation()
	const deleteMutation = useCategoryDeleteMutation()

	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [editing, setEditing] = useState<ProductCategory | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null)
	const [bulkDeleteTargets, setBulkDeleteTargets] = useState<ProductCategory[] | null>(null)
	const [selectedRows, setSelectedRows] = useState<CategoryRow[]>([])
	const [selectionClearKey, setSelectionClearKey] = useState(0)

	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [parentCategoryId, setParentCategoryId] = useState<string>("")
	const [requiresPrescription, setRequiresPrescription] = useState(false)

	const parentMap = useMemo(() => {
		const list = categoriesQuery.data ?? []
		return new Map(list.map(c => [c.id, c.name]))
	}, [categoriesQuery.data])

	const rows: CategoryRow[] = useMemo(() => {
		const list = categoriesQuery.data ?? []
		return list.map(c => ({
			...c,
			parentName: c.parentCategoryId ? parentMap.get(c.parentCategoryId) ?? c.parentCategoryId : "—",
		}))
	}, [categoriesQuery.data, parentMap])

	const openCreate = useCallback(() => {
		setName("")
		setDescription("")
		setParentCategoryId("")
		setRequiresPrescription(false)
		setIsCreateOpen(true)
	}, [])

	const requestBulkDelete = useCallback(() => {
		if (selectedRows.length > 0) setBulkDeleteTargets(selectedRows)
	}, [selectedRows])

	useImperativeHandle(
		ref,
		() => ({ openCreate, requestBulkDelete }),
		[openCreate, requestBulkDelete]
	)

	const openEdit = (cat: ProductCategory) => {
		setEditing(cat)
		setName(cat.name ?? "")
		setDescription(cat.description ?? "")
		setParentCategoryId(cat.parentCategoryId ?? "")
		setRequiresPrescription(!!cat.requiresPrescription)
		setIsEditOpen(true)
	}

	const submitCreate = async () => {
		const trimmed = name.trim()
		if (!trimmed) {
			toast({ title: "Validation", description: "Category name is required.", variant: "destructive" })
			return
		}
		try {
			await createMutation.mutateAsync({
				name: trimmed,
				description: description.trim() || undefined,
				parentCategoryId: parentCategoryId || undefined,
				requiresPrescription,
			})
			toast({ title: "Category created" })
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
			toast({ title: "Validation", description: "Category name is required.", variant: "destructive" })
			return
		}
		try {
			await updateMutation.mutateAsync({
				id: editing.id,
				name: trimmed,
				description: description.trim() || undefined,
				parentCategoryId: parentCategoryId || null,
				requiresPrescription,
			})
			toast({ title: "Category updated" })
			setIsEditOpen(false)
			setEditing(null)
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
			await deleteMutation.mutateAsync(deleteTarget.id)
			toast({ title: "Category deleted" })
			setDeleteTarget(null)
			setSelectionClearKey(k => k + 1)
		} catch (e) {
			toast({
				title: "Delete failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const confirmBulkDelete = async () => {
		if (!bulkDeleteTargets?.length) return
		try {
			for (const c of bulkDeleteTargets) {
				await deleteMutation.mutateAsync(c.id)
			}
			toast({ title: "Categories deleted" })
			setBulkDeleteTargets(null)
			setSelectionClearKey(k => k + 1)
		} catch (e) {
			toast({
				title: "Delete failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const columns: ColumnDef<CategoryRow>[] = useMemo(
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
								aria-label="Delete category"
								onClick={e => {
									e.stopPropagation()
									setDeleteTarget(row.original)
								}}
							>
							</Button>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "parentName",
				header: ({ column }) => <SortableHeader column={column} label="Parent" />,
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.parentName}</span>,
			},
			{
				accessorKey: "description",
				header: ({ column }) => <SortableHeader column={column} label="Description" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground inline-block max-w-[320px] truncate">
						{row.original.description || "—"}
					</span>
				),
			},
			{
				accessorKey: "requiresPrescription",
				header: ({ column }) => <SortableHeader column={column} label="Requires Rx" />,
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.requiresPrescription ? "Yes" : "No"}</span>
				),
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
					const c = row.original
					return (
						<div className="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => openEdit(c)}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
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
			<DataTable
				data={rows}
				columns={columns}
				isLoading={categoriesQuery.isLoading}
				errorText={categoriesQuery.isError ? "Failed to load categories." : null}
				searchPlaceholder="Search categories..."
				getRowId={row => row.id}
				onSelectedRowsChange={rows => {
					setSelectedRows(rows)
					onSelectionChange?.(rows)
				}}
				selectionClearKey={selectionClearKey}
			/>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add category</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="space-y-1">
							<Label htmlFor="cat-name">Name *</Label>
							<Input
								id="cat-name"
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="e.g. Pain relief"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-parent">Parent (optional)</Label>
							<select
								id="cat-parent"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={parentCategoryId}
								onChange={e => setParentCategoryId(e.target.value)}
							>
								<option value="">No parent (top-level)</option>
								{(categoriesQuery.data ?? []).map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-desc">Description</Label>
							<textarea
								id="cat-desc"
								className="border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={description}
								onChange={e => setDescription(e.target.value)}
								rows={3}
								placeholder="Brief description shown to customers (optional)"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-requiresPrescription">Requires prescription</Label>
							<select
								id="cat-requiresPrescription"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={requiresPrescription ? "true" : "false"}
								onChange={e => setRequiresPrescription(e.target.value === "true")}
							>
								<option value="false">No</option>
								<option value="true">Yes</option>
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button onClick={submitCreate} disabled={createMutation.isPending}>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isEditOpen}
				onOpenChange={open => {
					setIsEditOpen(open)
					if (!open) setEditing(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit category</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="space-y-1">
							<Label htmlFor="cat-name-edit">Name *</Label>
							<Input id="cat-name-edit" value={name} onChange={e => setName(e.target.value)} />
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-parent-edit">Parent (optional)</Label>
							<select
								id="cat-parent-edit"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={parentCategoryId}
								onChange={e => setParentCategoryId(e.target.value)}
							>
								<option value="">No parent</option>
								{(categoriesQuery.data ?? [])
									.filter(c => c.id !== editing?.id)
									.map(c => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-desc-edit">Description</Label>
							<textarea
								id="cat-desc-edit"
								className="border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={description}
								onChange={e => setDescription(e.target.value)}
								rows={3}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="cat-requiresPrescription-edit">Requires prescription</Label>
							<select
								id="cat-requiresPrescription-edit"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={requiresPrescription ? "true" : "false"}
								onChange={e => setRequiresPrescription(e.target.value === "true")}
							>
								<option value="false">No</option>
								<option value="true">Yes</option>
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditOpen(false)}>
							Cancel
						</Button>
						<Button onClick={submitEdit} disabled={updateMutation.isPending}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={open => {
					if (!open) setDeleteTarget(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete category</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>?
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!bulkDeleteTargets?.length}
				onOpenChange={open => {
					if (!open) setBulkDeleteTargets(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete {bulkDeleteTargets?.length ?? 0} categories?</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						This action cannot be undone. Child categories or products may block deletion for some rows.
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBulkDeleteTargets(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => void confirmBulkDelete()}
							disabled={deleteMutation.isPending}
						>
							Delete all
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
})

CategoriesTable.displayName = "CategoriesTable"
