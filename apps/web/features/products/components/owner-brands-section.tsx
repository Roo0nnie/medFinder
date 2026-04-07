"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { DataTable } from "@/core/components/data-table/data-table"
import { Button } from "@/core/components/ui/button"
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
	useMyBrandsQuery,
	type Brand,
} from "@/features/brands/api/brands.hooks"

export function OwnerBrandsSection() {
	const { toast } = useToast()
	const mineQuery = useMyBrandsQuery()
	const createMutation = useBrandCreateMutation()
	const updateMutation = useBrandMineUpdateMutation()
	const unlinkMutation = useBrandUnlinkMutation()

	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [editing, setEditing] = useState<Brand | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)
	const [name, setName] = useState("")

	const rows = useMemo(() => mineQuery.data ?? [], [mineQuery.data])

	const openCreate = () => {
		setName("")
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
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
			},
			{
				id: "actions",
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

	const toolbarLeft = (
		<Button size="sm" className="h-8" onClick={openCreate}>
			<Plus className="mr-2 h-4 w-4" />
			Add brand
		</Button>
	)

	return (
		<>
			<div className="mb-4">
				<h2 className="text-lg font-semibold">Brands</h2>
				<p className="text-muted-foreground text-sm">
					Link global brands to your account, then pick them on products.
				</p>
			</div>

			<DataTable
				data={rows}
				columns={columns}
				toolbarLeft={toolbarLeft}
				isLoading={mineQuery.isLoading}
				errorText={mineQuery.isError ? "Failed to load brands." : null}
				searchPlaceholder="Search brands…"
			/>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add brand</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="brand-create-name">Name</Label>
						<Input
							id="brand-create-name"
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="e.g. Generic Pharma"
						/>
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
		</>
	)
}
