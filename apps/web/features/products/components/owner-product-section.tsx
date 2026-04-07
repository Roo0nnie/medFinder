"use client"

import { useCallback, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

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
	useInventoryListQuery,
	useProductCategoriesQuery,
	useProductCreateMutation,
	useProductDeleteMutation,
	useProductUpdateMutation,
	useProductVariantsQuery,
	useVariantCreateMutation,
	useVariantDeleteMutation,
	useVariantUpdateMutation,
	type PharmacyInventoryItem,
	type Product,
	type ProductVariant,
} from "@/features/products/api/products.hooks"
import { ProductBrandCombobox } from "@/features/products/components/product-brand-combobox"
import { ProductsTable } from "@/features/products/components/products-table"
import { getStockStatus } from "@/features/products/lib/stock-status"

const emptyForm: Partial<Product> & { variantId?: string | null } = {
	pharmacyId: "",
	name: "",
	brandName: "",
	genericName: "",
	description: "",
	categoryId: "",
	unit: "piece",
	manufacturer: "",
	dosageForm: "",
	strength: "",
	requiresPrescription: false,
	imageUrl: "",
	supplier: "",
	lowStockThreshold: undefined,
	quantity: 0,
	price: "",
	discountPrice: "",
	expiryDate: undefined,
	batchNumber: "",
	isAvailable: true,
}

function inventoryRowFor(
	list: PharmacyInventoryItem[] | undefined,
	variantId: string | null
): PharmacyInventoryItem | undefined {
	return list?.find(r => (r.variantId ?? null) === (variantId ?? null))
}

function VariantInventoryEditor({
	productId,
	variantId,
	title,
	row,
	lowStockThreshold,
	onSaved,
}: {
	productId: string
	variantId: string | null
	title: string
	row: PharmacyInventoryItem | undefined
	lowStockThreshold: number
	onSaved: () => void
}) {
	const { toast } = useToast()
	const updateMutation = useProductUpdateMutation()
	const [quantity, setQuantity] = useState(String(row?.quantity ?? 0))
	const [price, setPrice] = useState(row?.price ? String(row.price) : "")
	const [discountPrice, setDiscountPrice] = useState(row?.discountPrice ? String(row.discountPrice) : "")
	const [expiryDate, setExpiryDate] = useState(
		row?.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : ""
	)
	const [batchNumber, setBatchNumber] = useState(row?.batchNumber ?? "")
	const [isAvailable, setIsAvailable] = useState(row?.isAvailable ?? true)

	useEffect(() => {
		setQuantity(String(row?.quantity ?? 0))
		setPrice(row?.price ? String(row.price) : "")
		setDiscountPrice(row?.discountPrice ? String(row.discountPrice) : "")
		setExpiryDate(row?.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : "")
		setBatchNumber(row?.batchNumber ?? "")
		setIsAvailable(row?.isAvailable ?? true)
	}, [row?.id, row?.quantity, row?.price, row?.discountPrice, row?.expiryDate, row?.batchNumber, row?.isAvailable])

	const status = getStockStatus({
		quantity: Number(quantity) || 0,
		isAvailable,
		lowStockThreshold,
	})

	const save = useCallback(async () => {
		const q = Number(quantity)
		const p = Number(price)
		if (Number.isNaN(q) || q < 0 || Number.isNaN(p) || p < 0) {
			toast({
				title: "Validation",
				description: "Quantity and price must be valid non-negative numbers.",
				variant: "destructive",
			})
			return
		}
		try {
			await updateMutation.mutateAsync({
				id: productId,
				variantId: variantId ?? null,
				quantity: q,
				price: String(p),
				discountPrice: discountPrice.trim() ? discountPrice.trim() : null,
				expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
				batchNumber: batchNumber.trim() || null,
				isAvailable,
			})
			toast({ title: "Inventory saved" })
			onSaved()
		} catch (e: unknown) {
			toast({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}, [
		productId,
		variantId,
		quantity,
		price,
		discountPrice,
		expiryDate,
		batchNumber,
		isAvailable,
		onSaved,
		toast,
		updateMutation,
	])

	return (
		<div className="border-border bg-background/80 space-y-3 rounded-lg border p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="text-foreground text-sm font-medium">{title}</p>
					<p className="text-muted-foreground text-xs">Stock and price for this option at your pharmacy.</p>
				</div>
				<span
					className={`rounded-md px-2 py-0.5 text-xs font-medium ${
						status.kind === "not_for_sale"
							? "bg-muted text-muted-foreground"
							: status.kind === "out_of_stock"
								? "bg-destructive/10 text-destructive"
								: status.kind === "low_stock"
									? "bg-amber-500/10 text-amber-600"
									: "bg-primary/10 text-primary"
					}`}
				>
					{status.label}
				</span>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1">
					<Label className="text-xs">Quantity</Label>
					<Input
						type="number"
						min={0}
						value={quantity}
						onChange={e => setQuantity(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Price</Label>
					<Input
						type="number"
						min={0}
						step="0.01"
						value={price}
						onChange={e => setPrice(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Discount price (optional)</Label>
					<Input
						type="number"
						min={0}
						step="0.01"
						value={discountPrice}
						onChange={e => setDiscountPrice(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Expiry (optional)</Label>
					<Input
						type="date"
						value={expiryDate}
						onChange={e => setExpiryDate(e.target.value)}
					/>
				</div>
				<div className="space-y-1 sm:col-span-2">
					<Label className="text-xs">Batch number (optional)</Label>
					<Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} />
				</div>
				<div className="space-y-1 sm:col-span-2">
					<Label className="text-xs">Available for sale</Label>
					<select
						className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
						value={isAvailable ? "true" : "false"}
						onChange={e => setIsAvailable(e.target.value === "true")}
					>
						<option value="true">Yes</option>
						<option value="false">No</option>
					</select>
				</div>
			</div>
			<Button type="button" size="sm" onClick={() => void save()} disabled={updateMutation.isPending}>
				{updateMutation.isPending ? "Saving…" : "Save inventory"}
			</Button>
		</div>
	)
}

export function OwnerProductSection() {
	const { toast } = useToast()
	const { data: pharmacies } = useMyPharmaciesQuery()
	const { data: categories } = useProductCategoriesQuery()
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [editing, setEditing] = useState<Product | null>(null)
	const [productToDelete, setProductToDelete] = useState<Product | null>(null)
	const [newVariantLabel, setNewVariantLabel] = useState("")
	const queryClient = useQueryClient()
	const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
	const [editVariantLabel, setEditVariantLabel] = useState("")

	const { data: inventoryList } = useInventoryListQuery(
		editing?.id ? { productId: editing.id } : undefined
	)
	const { data: variants = [] } = useProductVariantsQuery(editing?.id)
	const createMutation = useProductCreateMutation()
	const updateMutation = useProductUpdateMutation()
	const deleteMutation = useProductDeleteMutation()
	const variantCreateMutation = useVariantCreateMutation()
	const variantUpdateMutation = useVariantUpdateMutation()
	const variantDeleteMutation = useVariantDeleteMutation()
	const [form, setForm] = useState<Partial<Product> & { variantId?: string | null }>(emptyForm)

	useEffect(() => {
		if (!editing) {
			setForm(emptyForm)
			return
		}
		setForm({
			...emptyForm,
			pharmacyId: editing.pharmacyId ?? "",
			name: editing.name,
			brandId: editing.brandId ?? undefined,
			brandName: editing.brandName,
			genericName: editing.genericName,
			description: editing.description,
			categoryId: editing.categoryId,
			unit: editing.unit,
			manufacturer: editing.manufacturer,
			dosageForm: editing.dosageForm,
			strength: editing.strength,
			requiresPrescription: editing.requiresPrescription,
			imageUrl: editing.imageUrl,
			supplier: editing.supplier,
			lowStockThreshold: editing.lowStockThreshold ?? undefined,
		})
	}, [editing])

	const submit = async () => {
		const name = (form.name ?? "").trim()
		const categoryId = (form.categoryId ?? "").trim()
		const unit = (form.unit ?? "").trim()
		if (!name || !categoryId || !unit) {
			toast({
				title: "Validation",
				description: "Name, Category, and Unit are required.",
				variant: "destructive",
			})
			return
		}

		const pharmacyId = (form.pharmacyId ?? "").trim()
		if (!editing && !pharmacyId) {
			toast({
				title: "Validation",
				description: "Pharmacy is required when creating a product.",
				variant: "destructive",
			})
			return
		}

		const lowStockThreshold =
			form.lowStockThreshold !== undefined && form.lowStockThreshold !== null
				? Number(form.lowStockThreshold)
				: undefined
		if (
			lowStockThreshold !== undefined &&
			(Number.isNaN(lowStockThreshold) || lowStockThreshold < 0)
		) {
			toast({
				title: "Validation",
				description: "Low stock threshold must be a non-negative number.",
				variant: "destructive",
			})
			return
		}

		try {
			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					name,
					categoryId,
					unit,
					pharmacyId: (form.pharmacyId ?? editing.pharmacyId) || undefined,
					brandId: form.brandId ?? null,
					brandName: form.brandName,
					genericName: form.genericName,
					description: form.description,
					manufacturer: form.manufacturer,
					dosageForm: form.dosageForm,
					strength: form.strength,
					requiresPrescription: form.requiresPrescription,
					imageUrl: form.imageUrl,
					supplier: form.supplier,
					lowStockThreshold: lowStockThreshold ?? null,
				})
				toast({ title: "Product updated" })
			} else {
				const quantity = form.quantity !== undefined && form.quantity !== null ? Number(form.quantity) : 0
				const priceNum =
					form.price !== undefined && form.price !== null && String(form.price).trim() !== ""
						? Number(form.price)
						: 0
				if (Number.isNaN(quantity) || quantity < 0 || Number.isNaN(priceNum) || priceNum < 0) {
					toast({
						title: "Validation",
						description: "Quantity and Price must be non-negative numbers.",
						variant: "destructive",
					})
					return
				}
				const payload = {
					...form,
					name,
					categoryId,
					unit,
					pharmacyId: pharmacyId || undefined,
					lowStockThreshold: lowStockThreshold ?? null,
					quantity,
					price: String(priceNum),
					discountPrice:
						form.discountPrice !== undefined &&
						form.discountPrice !== null &&
						String(form.discountPrice).trim() !== ""
							? String(form.discountPrice)
							: null,
					expiryDate: form.expiryDate ?? null,
					batchNumber: form.batchNumber ?? null,
					isAvailable: form.isAvailable ?? true,
					variantId: null,
				}
				await createMutation.mutateAsync(payload)
				toast({ title: "Product created" })
			}
			setEditing(null)
			setIsFormOpen(false)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Save failed"
			toast({ title: "Save failed", description: message, variant: "destructive" })
		}
	}

	const confirmDelete = async () => {
		if (!productToDelete) return
		try {
			await deleteMutation.mutateAsync(productToDelete.id)
			toast({ title: "Product deleted" })
			if (editing?.id === productToDelete.id) {
				setEditing(null)
				setIsFormOpen(false)
			}
			setProductToDelete(null)
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
							<h2 className="text-lg font-semibold">Product</h2>
							<p className="text-muted-foreground text-sm">
								Add product details and initial inventory at creation time.
							</p>
						</div>
						<Button
							onClick={() => {
								setEditing(null)
								setIsFormOpen(true)
							}}
						>
							Add product
						</Button>
					</div>
					<div className="mt-4">
						<ProductsTable
							onEdit={p => {
								setEditing(p)
								setIsFormOpen(true)
							}}
							onDelete={p => setProductToDelete(p)}
						/>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={open => {
					setIsFormOpen(open)
					if (!open) setEditing(null)
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{editing
							? "Update product details below, then use Save product. Set stock and price per variant (or default) separately — each has its own Save inventory button."
							: "Fill in product details and set initial inventory. Name, Category, Unit, and Pharmacy are required. After creating a product, open Edit to add variants (sizes/volumes)."}
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label htmlFor="pharmacy">Pharmacy *</Label>
							<select
								id="pharmacy"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.pharmacyId ?? ""}
								onChange={e => setForm(prev => ({ ...prev, pharmacyId: e.target.value }))}
								disabled={!pharmacies?.length}
							>
								<option value="">Select pharmacy</option>
								{pharmacies?.map(ph => (
									<option key={ph.id} value={ph.id}>
										{ph.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								value={form.name ?? ""}
								onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
								placeholder="e.g. Paracetamol 500mg"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="category">Category *</Label>
							<select
								id="category"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.categoryId ?? ""}
								onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
							>
								<option value="">Select category</option>
								{categories?.map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="unit">Unit *</Label>
							<Input
								id="unit"
								value={form.unit ?? ""}
								onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
								placeholder="e.g. tablet, bottle, box"
							/>
						</div>
						<div className="space-y-1 sm:col-span-2">
							<Label>Brand</Label>
							<ProductBrandCombobox
								value={{
									brandId: form.brandId,
									brandName: form.brandName ?? "",
								}}
								onChange={next =>
									setForm(prev => ({
										...prev,
										brandId: next.brandId ?? undefined,
										brandName: next.brandName,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="genericName">Generic name</Label>
							<Input
								id="genericName"
								value={form.genericName ?? ""}
								onChange={e => setForm(prev => ({ ...prev, genericName: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="manufacturer">Manufacturer</Label>
							<Input
								id="manufacturer"
								value={form.manufacturer ?? ""}
								onChange={e => setForm(prev => ({ ...prev, manufacturer: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="supplier">Supplier</Label>
							<Input
								id="supplier"
								value={form.supplier ?? ""}
								onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="dosageForm">Dosage form</Label>
							<Input
								id="dosageForm"
								value={form.dosageForm ?? ""}
								onChange={e => setForm(prev => ({ ...prev, dosageForm: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="strength">Strength</Label>
							<Input
								id="strength"
								value={form.strength ?? ""}
								onChange={e => setForm(prev => ({ ...prev, strength: e.target.value }))}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="lowStockThreshold">Low stock threshold</Label>
							<Input
								id="lowStockThreshold"
								type="number"
								min={0}
								value={form.lowStockThreshold ?? ""}
								onChange={e => {
									const v = e.target.value
									setForm(prev => ({
										...prev,
										lowStockThreshold: v === "" ? undefined : Number(v),
									}))
								}}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="imageUrl">Image URL</Label>
							<Input
								id="imageUrl"
								value={form.imageUrl ?? ""}
								onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
								placeholder="https://..."
							/>
						</div>
						{editing && (
							<div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4 sm:col-span-2">
								<div>
									<h3 className="text-foreground text-sm font-semibold">Product variants (sizes / volumes)</h3>
									<p className="text-muted-foreground mt-0.5 text-xs">
										Add options like 100ml, 500ml so customers can choose. Set stock and price for each variant in the inventory section below.
									</p>
								</div>
								{variants.length === 0 ? (
									<div className="text-muted-foreground rounded-md border border-dashed bg-background/50 px-3 py-4 text-center text-sm">
										No variants yet. Add one below (e.g. &quot;100ml bottle&quot;, &quot;500ml&quot;) and click Add variant. Then choose that variant in Initial inventory to set its price and quantity.
									</div>
								) : null}
								<ul className="space-y-2">
									{variants.map(v => (
										<li key={v.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
											{editingVariant?.id === v.id ? (
												<>
													<Input
														className="max-w-[200px]"
														value={editVariantLabel}
														onChange={e => setEditVariantLabel(e.target.value)}
														placeholder="Variant label"
													/>
													<Button
														size="sm"
														variant="outline"
														onClick={async () => {
															if (!editing?.id) return
															try {
																await variantUpdateMutation.mutateAsync({
																	productId: editing.id,
																	variantId: v.id,
																	label: editVariantLabel.trim(),
																})
																setEditingVariant(null)
																setEditVariantLabel("")
																toast({ title: "Variant updated" })
															} catch (e) {
																toast({
																	title: "Update failed",
																	description: e instanceof Error ? e.message : "Unknown error",
																	variant: "destructive",
																})
															}
														}}
													>
														Save
													</Button>
													<Button size="sm" variant="ghost" onClick={() => { setEditingVariant(null); setEditVariantLabel("") }}>
														Cancel
													</Button>
												</>
											) : (
												<>
													<span className="font-medium">{v.label}</span>
													<Button
														size="sm"
														variant="ghost"
														className="ml-auto"
														onClick={() => {
															setEditingVariant(v)
															setEditVariantLabel(v.label)
														}}
													>
														Edit
													</Button>
													<Button
														size="sm"
														variant="ghost"
														className="text-destructive"
														onClick={async () => {
															if (!editing?.id) return
															try {
																await variantDeleteMutation.mutateAsync({ productId: editing.id, variantId: v.id })
																void queryClient.invalidateQueries({ queryKey: ["inventory"] })
																toast({ title: "Variant deleted" })
															} catch (e) {
																toast({
																	title: "Delete failed",
																	description: e instanceof Error ? e.message : "Unknown error",
																	variant: "destructive",
																})
															}
														}}
													>
														Delete
													</Button>
												</>
											)}
										</li>
									))}
								</ul>
								<div className="flex flex-wrap items-end gap-2">
									<div className="min-w-0 flex-1 space-y-1 sm:max-w-[280px]">
										<Label htmlFor="new-variant-label" className="text-muted-foreground text-xs">
											Add new variant
										</Label>
										<Input
											id="new-variant-label"
											className="w-full"
											value={newVariantLabel}
											onChange={e => setNewVariantLabel(e.target.value)}
											placeholder="e.g. 100ml bottle, 500ml, 30ml"
											onKeyDown={e => {
												if (e.key === "Enter") {
													e.preventDefault()
													if (editing?.id && newVariantLabel.trim()) {
														variantCreateMutation.mutate(
															{ productId: editing.id, label: newVariantLabel.trim() },
															{
																onSuccess: () => {
																	setNewVariantLabel("")
																	toast({ title: "Variant added" })
																},
																onError: e =>
																	toast({
																		title: "Add failed",
																		description: e.message,
																		variant: "destructive",
																	}),
															}
														)
													}
												}
											}}
										/>
									</div>
									<Button
										size="sm"
										onClick={async () => {
											if (!editing?.id || !newVariantLabel.trim()) {
												if (!newVariantLabel.trim()) {
													toast({
														title: "Enter a variant label",
														description: "e.g. 100ml bottle, 500ml",
														variant: "destructive",
													})
												}
												return
											}
											try {
												await variantCreateMutation.mutateAsync({
													productId: editing.id,
													label: newVariantLabel.trim(),
												})
												setNewVariantLabel("")
												toast({ title: "Variant added" })
											} catch (e) {
												toast({
													title: "Add failed",
													description: e instanceof Error ? e.message : "Unknown error",
													variant: "destructive",
												})
											}
										}}
									>
										Add variant
									</Button>
								</div>
							</div>
						)}
						<div className="space-y-1 sm:col-span-2">
							<h3 className="text-muted-foreground text-sm font-medium">
								{editing ? "Inventory at your pharmacy" : "Initial inventory"}
							</h3>
						</div>
						{editing && editing.id ? (
							<div className="space-y-4 sm:col-span-2">
								<VariantInventoryEditor
									key={`default-${editing.id}`}
									productId={editing.id}
									variantId={null}
									title="Default (no variant)"
									row={inventoryRowFor(inventoryList, null)}
									lowStockThreshold={form.lowStockThreshold ?? editing.lowStockThreshold ?? 5}
									onSaved={() => void queryClient.invalidateQueries({ queryKey: ["inventory"] })}
								/>
								{variants.map(v => (
									<VariantInventoryEditor
										key={`${v.id}-${editing.id}`}
										productId={editing.id}
										variantId={v.id}
										title={v.label}
										row={inventoryRowFor(inventoryList, v.id)}
										lowStockThreshold={form.lowStockThreshold ?? editing.lowStockThreshold ?? 5}
										onSaved={() => void queryClient.invalidateQueries({ queryKey: ["inventory"] })}
									/>
								))}
							</div>
						) : (
							<>
								<div className="space-y-1">
									<Label htmlFor="quantity">Quantity in stock</Label>
									<Input
										id="quantity"
										type="number"
										min={0}
										value={form.quantity ?? ""}
										onChange={e => setForm(prev => ({ ...prev, quantity: Number(e.target.value || 0) }))}
										placeholder="0"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="price">Price</Label>
									<Input
										id="price"
										type="number"
										min={0}
										step="0.01"
										value={form.price ?? ""}
										onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="discountPrice">Discount price (optional)</Label>
									<Input
										id="discountPrice"
										type="number"
										min={0}
										step="0.01"
										value={form.discountPrice ?? ""}
										onChange={e => setForm(prev => ({ ...prev, discountPrice: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="expiryDate">Expiry date (optional)</Label>
									<Input
										id="expiryDate"
										type="date"
										value={
											form.expiryDate ? new Date(form.expiryDate).toISOString().slice(0, 10) : ""
										}
										onChange={e => {
											const v = e.target.value
											setForm(prev => ({
												...prev,
												expiryDate: v ? new Date(v).toISOString() : undefined,
											}))
										}}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="batchNumber">Batch number (optional)</Label>
									<Input
										id="batchNumber"
										value={form.batchNumber ?? ""}
										onChange={e => setForm(prev => ({ ...prev, batchNumber: e.target.value }))}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="isAvailable">Available for sale</Label>
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
							</>
						)}
						<div className="space-y-1 sm:col-span-2">
							<Label htmlFor="requiresPrescription">Requires prescription</Label>
							<select
								id="requiresPrescription"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.requiresPrescription ? "true" : "false"}
								onChange={e =>
									setForm(prev => ({ ...prev, requiresPrescription: e.target.value === "true" }))
								}
							>
								<option value="false">No</option>
								<option value="true">Yes</option>
							</select>
						</div>
						<div className="space-y-1 sm:col-span-2">
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								className="border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.description ?? ""}
								onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setEditing(null)
								setIsFormOpen(false)
							}}
						>
							Cancel
						</Button>
						<Button onClick={submit}>{editing ? "Save product" : "Create product"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!productToDelete} onOpenChange={open => !open && setProductToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this product? This also deletes all inventory rows for
							this product and cannot be undone.
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
