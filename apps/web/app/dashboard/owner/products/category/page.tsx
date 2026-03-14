"use client"

import { useState } from "react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/core/components/ui/alert-dialog"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { useToast } from "@/core/components/ui/use-toast"
import {
	useCategoryCreateMutation,
	useCategoryDeleteMutation,
	useCategoryUpdateMutation,
	useProductCategoriesQuery,
	type ProductCategory,
} from "@/features/products/api/products.hooks"

type CategoryForm = {
	name: string
	description: string
	parentCategoryId: string
}

const emptyForm: CategoryForm = {
	name: "",
	description: "",
	parentCategoryId: "",
}

export default function OwnerCategoriesTabPage() {
	const { toast } = useToast()
	const { data: categories, isLoading, isError } = useProductCategoriesQuery()
	const createMutation = useCategoryCreateMutation()
	const updateMutation = useCategoryUpdateMutation()
	const deleteMutation = useCategoryDeleteMutation()

	const [editing, setEditing] = useState<ProductCategory | null>(null)
	const [toDelete, setToDelete] = useState<ProductCategory | null>(null)
	const [form, setForm] = useState<CategoryForm>(emptyForm)

	const beginCreate = () => {
		setEditing(null)
		setForm(emptyForm)
	}

	const beginEdit = (cat: ProductCategory) => {
		setEditing(cat)
		setForm({
			name: cat.name ?? "",
			description: cat.description ?? "",
			parentCategoryId: cat.parentCategoryId ?? "",
		})
	}

	const save = async () => {
		const name = form.name.trim()
		if (!name) {
			toast({ title: "Validation", description: "Category name is required.", variant: "destructive" })
			return
		}

		try {
			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					name,
					description: form.description.trim(),
					parentCategoryId: form.parentCategoryId || null,
				})
				toast({ title: "Category updated" })
			} else {
				await createMutation.mutateAsync({
					name,
					description: form.description.trim(),
					parentCategoryId: form.parentCategoryId || null,
				})
				toast({ title: "Category created" })
			}
			beginCreate()
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Save failed"
			toast({ title: "Save failed", description: message, variant: "destructive" })
		}
	}

	const confirmDelete = async () => {
		if (!toDelete) return
		try {
			await deleteMutation.mutateAsync(toDelete.id)
			toast({ title: "Category deleted" })
			if (editing?.id === toDelete.id) beginCreate()
			setToDelete(null)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Delete failed"
			toast({ title: "Delete failed", description: message, variant: "destructive" })
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold">Category</h2>
							<p className="text-muted-foreground text-sm">
								Create and maintain categories for your products.
							</p>
						</div>
						<Button onClick={beginCreate}>Add category</Button>
					</div>

					{isLoading && <p className="text-muted-foreground mt-3 text-sm">Loading...</p>}
					{isError && <p className="text-destructive mt-3 text-sm">Failed to load categories.</p>}

					<div className="mt-4 overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Parent</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(categories ?? []).map(cat => (
									<TableRow key={cat.id}>
										<TableCell className="font-medium">{cat.name}</TableCell>
										<TableCell>{cat.description || "—"}</TableCell>
										<TableCell>
											{cat.parentCategoryId
												? (categories?.find(c => c.id === cat.parentCategoryId)?.name ??
													cat.parentCategoryId)
												: "—"}
										</TableCell>
										<TableCell className="flex justify-end gap-2">
											<Button size="sm" variant="outline" onClick={() => beginEdit(cat)}>
												Edit
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="text-destructive"
												onClick={() => setToDelete(cat)}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
								{!isLoading && (categories ?? []).length === 0 && (
									<TableRow>
										<TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
											No categories yet.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4 p-4 sm:p-6">
					<h2 className="text-lg font-semibold">{editing ? "Edit category" : "New category"}</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								value={form.name}
								onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="parentCategory">Parent category</Label>
							<select
								id="parentCategory"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.parentCategoryId}
								onChange={e => setForm(prev => ({ ...prev, parentCategoryId: e.target.value }))}
							>
								<option value="">None</option>
								{(categories ?? [])
									.filter(c => c.id !== editing?.id)
									.map(cat => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
							</select>
						</div>
						<div className="space-y-1 sm:col-span-2">
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								className="border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.description}
								onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
								rows={3}
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={beginCreate}>
							Cancel
						</Button>
						<Button onClick={save}>{editing ? "Save changes" : "Create category"}</Button>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete category</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this category? Categories assigned to products cannot
							be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
