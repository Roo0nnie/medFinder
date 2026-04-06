"use client"

import { useMemo, useState } from "react"

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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useToast } from "@/core/components/ui/use-toast"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import {
	useInventoryCreateMutation,
	useInventoryDeleteMutation,
	useInventoryListQuery,
	useInventoryUpdateMutation,
	useProductsQuery,
	useProductVariantsQuery,
	type PharmacyInventoryItem,
} from "@/features/products/api/products.hooks"
import { InventoryTable } from "@/features/products/components/inventory-table"

type InventoryForm = {
	pharmacyId: string
	productId: string
	variantId: string
	quantity: string
	price: string
	discountPrice: string
	expiryDate: string
	batchNumber: string
	isAvailable: boolean
}

const emptyForm: InventoryForm = {
	pharmacyId: "",
	productId: "",
	variantId: "",
	quantity: "0",
	price: "0",
	discountPrice: "",
	expiryDate: "",
	batchNumber: "",
	isAvailable: true,
}

export function OwnerInventorySection() {
	const { toast } = useToast()
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: products } = useProductsQuery()
	useInventoryListQuery()
	const createMutation = useInventoryCreateMutation()
	const updateMutation = useInventoryUpdateMutation()
	const deleteMutation = useInventoryDeleteMutation()

	const [isFormOpen, setIsFormOpen] = useState(false)
	const [editing, setEditing] = useState<PharmacyInventoryItem | null>(null)
	const [toDelete, setToDelete] = useState<PharmacyInventoryItem | null>(null)
	const [form, setForm] = useState<InventoryForm>(emptyForm)

	const productMap = useMemo(() => new Map((products ?? []).map(p => [p.id, p.name])), [products])
	const pharmacyMap = useMemo(
		() => new Map((pharmacies ?? []).map(p => [p.id, p.name])),
		[pharmacies]
	)
	const { data: variants = [] } = useProductVariantsQuery(form.productId || undefined)

	const closeForm = () => {
		setIsFormOpen(false)
		setEditing(null)
		setForm(emptyForm)
	}

	const beginCreate = () => {
		setEditing(null)
		setForm(emptyForm)
		setIsFormOpen(true)
	}

	const beginEdit = (row: PharmacyInventoryItem) => {
		setEditing(row)
		setForm({
			pharmacyId: row.pharmacyId,
			productId: row.productId,
			variantId: row.variantId ?? "",
			quantity: String(row.quantity),
			price: row.price ?? "0",
			discountPrice: row.discountPrice ?? "",
			expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : "",
			batchNumber: row.batchNumber ?? "",
			isAvailable: row.isAvailable,
		})
		setIsFormOpen(true)
	}

	const save = async () => {
		const quantity = Number(form.quantity)
		const price = Number(form.price)
		if (Number.isNaN(quantity) || quantity < 0 || Number.isNaN(price) || price < 0) {
			toast({
				title: "Validation",
				description: "Quantity and price must be non-negative numbers.",
				variant: "destructive",
			})
			return
		}

		if (!editing && (!form.pharmacyId || !form.productId)) {
			toast({
				title: "Validation",
				description: "Pharmacy and product are required.",
				variant: "destructive",
			})
			return
		}

		try {
			const payload = {
				quantity,
				price: String(price),
				discountPrice: form.discountPrice.trim() ? form.discountPrice.trim() : null,
				expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
				batchNumber: form.batchNumber.trim() || null,
				isAvailable: form.isAvailable,
				variantId: form.variantId.trim() || null,
			}

			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					...payload,
				})
				toast({ title: "Inventory updated" })
			} else {
				await createMutation.mutateAsync({
					pharmacyId: form.pharmacyId,
					productId: form.productId,
					...payload,
				})
				toast({ title: "Inventory created" })
			}
			closeForm()
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Save failed"
			toast({ title: "Save failed", description: message, variant: "destructive" })
		}
	}

	const confirmDelete = async () => {
		if (!toDelete) return
		try {
			await deleteMutation.mutateAsync(toDelete.id)
			toast({ title: "Inventory deleted" })
			if (editing?.id === toDelete.id) closeForm()
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
							<h2 className="text-lg font-semibold">Inventory</h2>
							<p className="text-muted-foreground text-sm">
								Update stock, prices, availability, batch, expiry, and other inventory values.
							</p>
						</div>
						<Button onClick={beginCreate}>Add inventory</Button>
					</div>

					<div className="mt-4">
						<InventoryTable onEditRow={row => beginEdit(row)} onDeleteRow={row => setToDelete(row)} />
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={open => {
					setIsFormOpen(open)
					if (!open) {
						setEditing(null)
						setForm(emptyForm)
					}
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{editing ? "Edit inventory" : "Add inventory"}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label htmlFor="pharmacy">Pharmacy *</Label>
							<select
								id="pharmacy"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.pharmacyId}
								onChange={e => setForm(prev => ({ ...prev, pharmacyId: e.target.value }))}
								disabled={!!editing}
							>
								<option value="">Select pharmacy</option>
								{(pharmacies ?? []).map(ph => (
									<option key={ph.id} value={ph.id}>
										{ph.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="product">Product *</Label>
							<select
								id="product"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.productId}
								onChange={e =>
									setForm(prev => ({ ...prev, productId: e.target.value, variantId: "" }))
								}
								disabled={!!editing}
							>
								<option value="">Select product</option>
								{(products ?? [])
									.filter(p => !form.pharmacyId || p.pharmacyId === form.pharmacyId)
									.map(prod => (
										<option key={prod.id} value={prod.id}>
											{prod.name}
										</option>
									))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="variant">Variant</Label>
							<select
								id="variant"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.variantId}
								onChange={e => setForm(prev => ({ ...prev, variantId: e.target.value }))}
								disabled={!!editing}
							>
								<option value="">Default (no variant)</option>
								{variants.map(v => (
									<option key={v.id} value={v.id}>
										{v.label}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="quantity">Quantity</Label>
							<Input
								id="quantity"
								type="number"
								min={0}
								value={form.quantity}
								onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="price">Price</Label>
							<Input
								id="price"
								type="number"
								min={0}
								step="0.01"
								value={form.price}
								onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="discountPrice">Discount price</Label>
							<Input
								id="discountPrice"
								type="number"
								min={0}
								step="0.01"
								value={form.discountPrice}
								onChange={e => setForm(prev => ({ ...prev, discountPrice: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="expiryDate">Expiry date</Label>
							<Input
								id="expiryDate"
								type="date"
								value={form.expiryDate}
								onChange={e => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="batchNumber">Batch number</Label>
							<Input
								id="batchNumber"
								value={form.batchNumber}
								onChange={e => setForm(prev => ({ ...prev, batchNumber: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="isAvailable">Available</Label>
							<select
								id="isAvailable"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.isAvailable ? "true" : "false"}
								onChange={e =>
									setForm(prev => ({ ...prev, isAvailable: e.target.value === "true" }))
								}
							>
								<option value="true">Yes</option>
								<option value="false">No</option>
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={closeForm}>
							Cancel
						</Button>
						<Button onClick={save}>{editing ? "Save changes" : "Create inventory"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete inventory row</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this inventory row? This action cannot be undone.
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
