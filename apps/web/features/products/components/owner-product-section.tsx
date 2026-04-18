"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { Field, FieldDescription, FieldLabel } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { cn } from "@/core/lib/utils"
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
	uploadVariantImage,
	type PharmacyInventoryItem,
	type Product,
	type ProductVariant,
} from "@/features/products/api/products.hooks"
import { ProductBrandCombobox } from "@/features/products/components/product-brand-combobox"
import { ProductsTable } from "@/features/products/components/products-table"
import { getStockStatus } from "@/features/products/lib/stock-status"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

/** Stable reference when the variants query has no data yet (avoids useEffect loops). */
const EMPTY_PRODUCT_VARIANTS: ProductVariant[] = []

/** Display order for owner gallery: explicit list, else single imageUrl. */
function variantGalleryUrls(v: ProductVariant): string[] {
	const fromList = (v.imageUrls ?? [])
		.map(u => (typeof u === "string" ? u.trim() : ""))
		.filter(Boolean)
	if (fromList.length > 0) return fromList
	const one = v.imageUrl?.trim()
	return one ? [one] : []
}

function reorderGalleryUrls(urls: string[], index: number, direction: -1 | 1): string[] {
	const j = index + direction
	if (j < 0 || j >= urls.length) return urls
	const next = [...urls]
	const a = next[index]
	const b = next[j]
	if (a === undefined || b === undefined) return urls
	next[index] = b
	next[j] = a
	return next
}

const emptyForm: Partial<Product> & { variantId?: string | null } = {
	pharmacyId: "",
	name: "",
	brandName: "",
	genericName: "",
	description: "",
	categoryId: "",
	variantLabel: "",
	unit: "piece",
	manufacturer: "",
	dosageForm: "",
	strength: "",
	requiresPrescription: false,
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
	unit,
	strength,
	dosageForm,
	onVariantDetailChange,
}: {
	productId: string
	variantId: string | null
	title: string
	row: PharmacyInventoryItem | undefined
	lowStockThreshold: number
	onSaved: () => void
	unit: string
	strength: string
	dosageForm: string
	onVariantDetailChange: (
		patch: Partial<{ unit: string; strength: string; dosageForm: string }>
	) => void
}) {
	const { toast } = useToast()
	const updateMutation = useProductUpdateMutation()
	const variantUpdateMutation = useVariantUpdateMutation()
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
		if (!variantId) {
			toast({
				title: "Validation",
				description: "This option is missing a variant id.",
				variant: "destructive",
			})
			return
		}
		try {
			await variantUpdateMutation.mutateAsync({
				productId,
				variantId,
				unit: unit.trim() || "piece",
				strength: strength.trim() || undefined,
				dosageForm: dosageForm.trim() || undefined,
			})
			await updateMutation.mutateAsync({
				id: productId,
				variantId,
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
		unit,
		strength,
		dosageForm,
		onSaved,
		toast,
		updateMutation,
		variantUpdateMutation,
	])

	return (
		<div className="border-border bg-background/80 space-y-3 rounded-lg border p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="text-foreground text-sm font-medium">{title}</p>
					<p className="text-muted-foreground text-xs">
						Unit, strength, dosage form, quantity, and price for this option at your pharmacy.
					</p>
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
					<Label className="text-xs">Unit</Label>
					<Input
						value={unit}
						onChange={e => onVariantDetailChange({ unit: e.target.value })}
						placeholder="e.g. bottle, tablet"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Strength</Label>
					<Input
						value={strength}
						onChange={e => onVariantDetailChange({ strength: e.target.value })}
						placeholder="e.g. 500 mg"
					/>
				</div>
				<div className="space-y-1 sm:col-span-2">
					<Label className="text-xs">Dosage form</Label>
					<Input
						value={dosageForm}
						onChange={e => onVariantDetailChange({ dosageForm: e.target.value })}
						placeholder="e.g. tablet, syrup"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Quantity</Label>
					<Input
						type="number"
						min={0}
						value={quantity}
						onChange={e => setQuantity(e.target.value)}
						placeholder="0"
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
						placeholder="0.00"
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
						placeholder="0.00"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Expiry (optional)</Label>
					<Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
				</div>
				<div className="space-y-1 sm:col-span-2">
					<Label className="text-xs">Batch number (optional)</Label>
					<Input
						value={batchNumber}
						onChange={e => setBatchNumber(e.target.value)}
						placeholder="e.g. LOT-2024-001"
					/>
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
			<Button
				type="button"
				size="sm"
				onClick={() => void save()}
				disabled={variantUpdateMutation.isPending || updateMutation.isPending}
			>
				{variantUpdateMutation.isPending || updateMutation.isPending ? "Saving…" : "Save inventory"}
			</Button>
		</div>
	)
}

type OwnerProductDeleteState =
	| { kind: "one"; product: Product }
	| { kind: "many"; products: Product[] }
	| null

export function OwnerProductSection() {
	const { toast } = useToast()
	const { data: pharmacies, isError: pharmaciesQueryError } = useMyPharmaciesQuery()
	const solePharmacyId = useMemo(
		() => (pharmacies?.length === 1 && pharmacies[0] ? pharmacies[0].id : undefined),
		[pharmacies]
	)
	const { data: categories, isError: categoriesQueryError } = useProductCategoriesQuery()

	const pharmaciesLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (pharmaciesQueryError) {
			if (!pharmaciesLoadErrorNotified.current) {
				pharmaciesLoadErrorNotified.current = true
				toast({
					title: "Failed to load pharmacies",
					description: "Product form needs your pharmacy list. Try refreshing the page.",
					variant: "destructive",
				})
			}
		} else {
			pharmaciesLoadErrorNotified.current = false
		}
	}, [pharmaciesQueryError, toast])

	const categoriesLoadErrorNotified = useRef(false)
	useEffect(() => {
		if (categoriesQueryError) {
			if (!categoriesLoadErrorNotified.current) {
				categoriesLoadErrorNotified.current = true
				toast({
					title: "Failed to load categories",
					description: "Could not load categories for the product form.",
					variant: "destructive",
				})
			}
		} else {
			categoriesLoadErrorNotified.current = false
		}
	}, [categoriesQueryError, toast])
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [editing, setEditing] = useState<Product | null>(null)
	const [addBrandSource, setAddBrandSource] = useState<Product | null>(null)
	const [productDeleteState, setProductDeleteState] = useState<OwnerProductDeleteState>(null)
	const [selectionClearKey, setSelectionClearKey] = useState(0)
	const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
	const [newVariantLabel, setNewVariantLabel] = useState("")
	const [newVariantUnit, setNewVariantUnit] = useState("piece")
	const [newVariantStrength, setNewVariantStrength] = useState("")
	const [newVariantDosageForm, setNewVariantDosageForm] = useState("")
	const queryClient = useQueryClient()
	const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
	const [editVariantLabel, setEditVariantLabel] = useState("")

	const { data: inventoryList } = useInventoryListQuery(
		editing?.id ? { productId: editing.id } : undefined
	)
	const { data: variantsData } = useProductVariantsQuery(editing?.id)
	const { data: addBrandVariantsData } = useProductVariantsQuery(
		addBrandSource && !editing ? addBrandSource.id : undefined
	)
	const variants = variantsData ?? EMPTY_PRODUCT_VARIANTS
	const createMutation = useProductCreateMutation()
	const updateMutation = useProductUpdateMutation()
	const deleteMutation = useProductDeleteMutation()
	const variantCreateMutation = useVariantCreateMutation()
	const variantUpdateMutation = useVariantUpdateMutation()
	const variantDeleteMutation = useVariantDeleteMutation()
	const [form, setForm] = useState<Partial<Product> & { variantId?: string | null }>(emptyForm)
	const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
	const [isImageBusy, setIsImageBusy] = useState(false)
	const [variantExtras, setVariantExtras] = useState<
		Record<string, { strength: string; dosageForm: string; unit: string }>
	>({})
	const [addGalleryUrlDraft, setAddGalleryUrlDraft] = useState<Record<string, string>>({})
	const handleEditProduct = useCallback((p: Product) => {
		setEditing(p)
		setIsFormOpen(true)
	}, [])
	const handleDeleteProduct = useCallback((p: Product) => {
		setProductDeleteState({ kind: "one", product: p })
	}, [])

	const handleDeleteManyProducts = useCallback((products: Product[]) => {
		if (products.length === 0) return
		setProductDeleteState({ kind: "many", products })
	}, [])
	const handleAddBrand = useCallback((p: Product) => {
		setAddBrandSource(p)
		setEditing(null)
		setIsFormOpen(true)
	}, [])

	useEffect(() => {
		const categoryId = (form.categoryId ?? "").trim()
		if (!categoryId) return
		const cat = categories?.find(c => c.id === categoryId)
		if (!cat) return
		setForm(prev =>
			prev.requiresPrescription === !!cat.requiresPrescription
				? prev
				: { ...prev, requiresPrescription: !!cat.requiresPrescription }
		)
	}, [form.categoryId, categories])

	useEffect(() => {
		if (!solePharmacyId) return
		setForm(prev => (prev.pharmacyId === solePharmacyId ? prev : { ...prev, pharmacyId: solePharmacyId }))
	}, [solePharmacyId])

	useEffect(() => {
		if (editing) {
			setForm({
				...emptyForm,
				pharmacyId: editing.pharmacyId ?? "",
				name: editing.name,
				brandId: editing.brandId ?? undefined,
				brandName: editing.brandName,
				genericName: editing.genericName,
				description: editing.description,
				categoryId: editing.categoryId,
				manufacturer: editing.manufacturer,
				requiresPrescription: editing.requiresPrescription,
				supplier: editing.supplier,
				lowStockThreshold: editing.lowStockThreshold ?? undefined,
			})
			setPendingImageFile(null)
			setVariantExtras({})
			return
		}
		if (addBrandSource) {
			return
		}
		setForm(emptyForm)
		setPendingImageFile(null)
		setVariantExtras({})
	}, [editing, addBrandSource])

	useEffect(() => {
		if (editing || !addBrandSource) return
		const v0 = addBrandVariantsData?.[0]
		setForm({
			...emptyForm,
			pharmacyId: "",
			name: addBrandSource.name,
			genericName: addBrandSource.genericName,
			categoryId: addBrandSource.categoryId,
			requiresPrescription: addBrandSource.requiresPrescription,
			variantLabel: v0?.label ?? "",
			unit: (v0?.unit ?? "piece").trim() || "piece",
			strength: (v0?.strength ?? "").trim(),
			dosageForm: (v0?.dosageForm ?? "").trim(),
			quantity: 0,
			price: "",
			lowStockThreshold: undefined,
		})
		setPendingImageFile(null)
	}, [editing, addBrandSource, addBrandVariantsData])

	useEffect(() => {
		const next: Record<string, { strength: string; dosageForm: string; unit: string }> = {}
		for (const v of variants) {
			next[v.id] = {
				strength: (v.strength ?? "").trim(),
				dosageForm: (v.dosageForm ?? "").trim(),
				unit: (v.unit ?? "").trim() || "piece",
			}
		}
		setVariantExtras(prev => {
			const prevKeys = Object.keys(prev)
			const nextKeys = Object.keys(next)
			if (prevKeys.length !== nextKeys.length) return next
			for (const key of nextKeys) {
				const prevValue = prev[key]
				const nextValue = next[key]
				if (
					!nextValue ||
					!prevValue ||
					prevValue.strength !== nextValue.strength ||
					prevValue.dosageForm !== nextValue.dosageForm ||
					prevValue.unit !== nextValue.unit
				) {
					return next
				}
			}
			return prev
		})
	}, [variants])

	const clearImageAll = () => {
		setPendingImageFile(null)
	}

	const persistVariantGallery = async (v: ProductVariant, urls: string[]) => {
		if (!editing?.id) return
		const next = urls.map(u => u.trim()).filter(Boolean)
		try {
			await variantUpdateMutation.mutateAsync({
				productId: editing.id,
				variantId: v.id,
				imageUrls: next,
				imageUrl: next[0] ?? "",
			})
			toast({ title: "Image gallery updated" })
		} catch (e) {
			toast({
				title: "Update failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	const handleVariantImageFile = async (variantId: string, f: File) => {
		if (!editing?.id) return
		setIsImageBusy(true)
		try {
			await uploadVariantImage(editing.id, variantId, f)
			void queryClient.invalidateQueries({ queryKey: ["product-variants", editing.id] })
			void queryClient.invalidateQueries({ queryKey: ["product-detail", editing.id] })
			void queryClient.invalidateQueries({ queryKey: ["products"] })
			void queryClient.invalidateQueries({ queryKey: ["landing", "catalog"] })
			toast({ title: "Image uploaded" })
		} catch (err) {
			toast({
				title: "Upload failed",
				description: err instanceof Error ? err.message : "Unknown error",
				variant: "destructive",
			})
		} finally {
			setIsImageBusy(false)
		}
	}

	const tryAddNewVariant = useCallback(async () => {
		if (!editing?.id) return
		const label = newVariantLabel.trim()
		const u = newVariantUnit.trim()
		if (!label || !u) {
			toast({
				title: "Validation",
				description: "Variant label and unit are required.",
				variant: "destructive",
			})
			return
		}
		try {
			await variantCreateMutation.mutateAsync({
				productId: editing.id,
				label,
				unit: u,
				strength: newVariantStrength.trim() || undefined,
				dosageForm: newVariantDosageForm.trim() || undefined,
			})
			setNewVariantLabel("")
			setNewVariantUnit("piece")
			setNewVariantStrength("")
			setNewVariantDosageForm("")
			toast({ title: "Variant added" })
		} catch (e) {
			toast({
				title: "Add failed",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}, [
		editing?.id,
		newVariantLabel,
		newVariantUnit,
		newVariantStrength,
		newVariantDosageForm,
		variantCreateMutation,
		toast,
	])

	const submit = async () => {
		const name = (form.name ?? "").trim()
		const categoryId = (form.categoryId ?? "").trim()
		const variantUnit = (form.unit ?? "").trim()
		const variantLabel = (form.variantLabel ?? "").trim()
		if (!name || !categoryId) {
			toast({
				title: "Validation",
				description: "Name and category are required.",
				variant: "destructive",
			})
			return
		}
		if (!editing && (!variantLabel || !variantUnit)) {
			toast({
				title: "Validation",
				description: "Variant label and unit are required for the first sellable option.",
				variant: "destructive",
			})
			return
		}

		const pharmacyId =
			(form.pharmacyId ?? "").trim() ||
			(pharmacies?.length === 1 && pharmacies[0] ? pharmacies[0].id : "")
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
					pharmacyId: (form.pharmacyId ?? editing.pharmacyId ?? solePharmacyId) || undefined,
					brandId: form.brandId ?? null,
					brandName: form.brandName,
					genericName: form.genericName,
					description: form.description,
					manufacturer: form.manufacturer,
					requiresPrescription: form.requiresPrescription,
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
					name,
					categoryId,
					variantLabel,
					unit: variantUnit,
					strength: form.strength,
					dosageForm: form.dosageForm,
					pharmacyId: pharmacyId || undefined,
					brandId: form.brandId ?? null,
					brandName: form.brandName,
					genericName: form.genericName,
					description: form.description,
					manufacturer: form.manufacturer,
					requiresPrescription: form.requiresPrescription,
					supplier: form.supplier,
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
				}
				const created = await createMutation.mutateAsync(payload)
				const firstVariantId = (created as Product & { variants?: ProductVariant[] }).variants?.[0]?.id
				if (pendingImageFile && created?.id && firstVariantId) {
					try {
						setIsImageBusy(true)
						await uploadVariantImage(created.id, firstVariantId, pendingImageFile)
						setPendingImageFile(null)
					} catch (err) {
						toast({
							title: "Image upload failed",
							description:
								err instanceof Error
									? err.message
									: "Product was created, but the image could not be uploaded.",
							variant: "destructive",
						})
					} finally {
						setIsImageBusy(false)
					}
				}
				toast({ title: "Product created" })
			}
			setEditing(null)
			setAddBrandSource(null)
			setIsFormOpen(false)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Save failed"
			toast({ title: "Save failed", description: message, variant: "destructive" })
		}
	}

	const confirmDelete = async () => {
		if (!productDeleteState) return
		try {
			if (productDeleteState.kind === "one") {
				const productToDelete = productDeleteState.product
				await deleteMutation.mutateAsync(productToDelete.id)
				toast({ title: "Product deleted" })
				if (editing?.id === productToDelete.id) {
					setEditing(null)
					setIsFormOpen(false)
				}
			} else {
				for (const p of productDeleteState.products) {
					await deleteMutation.mutateAsync(p.id)
				}
				toast({ title: `${productDeleteState.products.length} products deleted` })
				const deletedIds = new Set(productDeleteState.products.map(p => p.id))
				if (editing && deletedIds.has(editing.id)) {
					setEditing(null)
					setIsFormOpen(false)
				}
			}
			setProductDeleteState(null)
			setSelectionClearKey(k => k + 1)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Delete failed"
			toast({ title: "Delete failed", description: message, variant: "destructive" })
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold">Product</h2>
							<p className="text-muted-foreground text-sm">
								Add product details and initial inventory at creation time.
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<Button
								onClick={() => {
									setEditing(null)
									setAddBrandSource(null)
									setIsFormOpen(true)
								}}
							>
								<Plus className="mr-2 h-4 w-4" />
								Add product
							</Button>
							{selectedProducts.length > 0 ? (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="h-9"
									onClick={() => handleDeleteManyProducts(selectedProducts)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete {selectedProducts.length}{" "}
									{selectedProducts.length === 1 ? "Product" : "Products"}
								</Button>
							) : null}
						</div>
					</div>
					<div className="mt-4">
						<ProductsTable
							onEdit={handleEditProduct}
							onDelete={handleDeleteProduct}
							onAddBrand={handleAddBrand}
							onSelectionChange={setSelectedProducts}
							selectionClearKey={selectionClearKey}
						/>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={open => {
					setIsFormOpen(open)
					if (!open) {
						setEditing(null)
						setAddBrandSource(null)
					}
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editing
								? "Edit product"
								: addBrandSource
									? `Add brand for ${addBrandSource.name}`
									: "Add product"}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{editing
							? "Update product details below, then use Save product. Per variant, set unit, stock, and price — each option has its own Save inventory button (saves variant details and pharmacy stock together)."
							: addBrandSource
								? "This creates a new product row for your pharmacy with the same medicine details. Choose or create the new brand, adjust manufacturer and variants as needed, then save."
								: "Fill in product details and set initial inventory. Name, category, variant label, and unit are required for the first sellable option. Your pharmacy is applied automatically when you have one location. Label and strength are separate fields. Open Edit to add more variants."}
					</p>
					{addBrandSource && !editing && addBrandVariantsData && addBrandVariantsData.length > 0 ? (
						<p className="text-muted-foreground text-xs">
							Variants from original product:{" "}
							{addBrandVariantsData.map(v => v.label).join(", ")}
						</p>
					) : null}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label htmlFor="pharmacy">Pharmacy *</Label>
							<select
								id="pharmacy"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={(form.pharmacyId || solePharmacyId) ?? ""}
								onChange={e => setForm(prev => ({ ...prev, pharmacyId: e.target.value }))}
								disabled={!pharmacies?.length || pharmacies.length === 1}
							>
								{pharmacies && pharmacies.length > 1 ? (
									<option value="">Choose pharmacy…</option>
								) : null}
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
								<option value="">Choose category…</option>
								{categories?.map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="requiresPrescription">Requires prescription</Label>
							<select
								id="requiresPrescription"
								className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.requiresPrescription ? "true" : "false"}
								disabled
								aria-label="Requires prescription (follows category)"
							>
								<option value="false">No</option>
								<option value="true">Yes</option>
							</select>
						</div>
					
						<div className="space-y-1">
							<Label>Brand</Label>
							<ProductBrandCombobox
								placeholder="Search or choose brand (optional)"
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
								placeholder="e.g. acetaminophen"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="manufacturer">Manufacturer</Label>
							<Input
								id="manufacturer"
								value={form.manufacturer ?? ""}
								onChange={e => setForm(prev => ({ ...prev, manufacturer: e.target.value }))}
								placeholder="e.g. PharmaCo Ltd."
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="supplier">Supplier</Label>
							<Input
								id="supplier"
								value={form.supplier ?? ""}
								onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
								placeholder="e.g. regional distributor name"
							/>
						</div>
						{!editing ? (
							<>
								<div className="space-y-1">
									<Label htmlFor="variantLabel">Variant label *</Label>
									<Input
										id="variantLabel"
										value={form.variantLabel ?? ""}
										onChange={e => setForm(prev => ({ ...prev, variantLabel: e.target.value }))}
										placeholder="e.g. 500 mg tablets, 100 ml bottle"
									/>
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
								<div className="space-y-1">
									<Label htmlFor="strength">Strength (first variant)</Label>
									<Input
										id="strength"
										value={form.strength ?? ""}
										onChange={e => setForm(prev => ({ ...prev, strength: e.target.value }))}
										placeholder="e.g. 500 mg"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="dosageForm">Dosage form (first variant)</Label>
									<Input
										id="dosageForm"
										value={form.dosageForm ?? ""}
										onChange={e => setForm(prev => ({ ...prev, dosageForm: e.target.value }))}
										placeholder="e.g. tablet, syrup, injection"
									/>
								</div>
							</>
						) : null}
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
								placeholder="e.g. 10"
							/>
						</div>
						<div className="sm:col-span-2">
							{!editing ? (
								<Field className={cn(isImageBusy && "pointer-events-none opacity-70")}>
									<FieldLabel htmlFor="create-first-variant-picture">First variant picture</FieldLabel>
									<Input
										id="create-first-variant-picture"
										type="file"
										accept="image/jpeg,image/png,image/webp,image/gif"
										onChange={e => {
											const f = e.target.files?.[0] ?? null
											setPendingImageFile(f)
											e.target.value = ""
										}}
									/>
									<FieldDescription>
										Optional. JPEG, PNG, WebP, or GIF, up to 5 MB. Uploads after the product is created.
									</FieldDescription>
									{pendingImageFile ? (
										<button
											type="button"
											className="text-muted-foreground hover:text-foreground mt-1 text-xs font-medium underline-offset-4 hover:underline"
											onClick={clearImageAll}
											disabled={isImageBusy}
										>
											Clear selected file
										</button>
									) : null}
								</Field>
							) : (
								<p className="text-muted-foreground text-xs">
									Choose a picture file per variant in the list below (no preview).
								</p>
							)}
						</div>
						{editing && (
							<div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4 sm:col-span-2">
								<div>
									<h3 className="text-foreground text-sm font-semibold">Product variants (sizes / volumes)</h3>
									<p className="text-muted-foreground mt-0.5 text-xs">
										All sellable options are variants (including the first). Add more labels like 2mg or 100ml; for each option, set unit, stock, and price and use Save inventory.
									</p>
								</div>
								{variants.length === 0 ? (
									<div className="text-muted-foreground rounded-md border border-dashed bg-background/50 px-3 py-4 text-center text-sm">
										No extra variants yet. New products already have a first variant from creation. If this is legacy data with stock but no variants, run the one-time backfill script in the repo (packages/scripts/backfill-default-variants.ts). Otherwise add a variant below, then set inventory.
									</div>
								) : null}
								<ul className="space-y-2">
									{variants.map(v => (
										<li key={v.id} className="flex flex-col gap-2 rounded-md border px-3 py-2 text-sm">
											<div className="flex flex-wrap items-center gap-2">
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
																	const ex = variantExtras[v.id] ?? {
																		strength: "",
																		dosageForm: "",
																		unit: "piece",
																	}
																	await variantUpdateMutation.mutateAsync({
																		productId: editing.id,
																		variantId: v.id,
																		label: editVariantLabel.trim(),
																		strength: ex.strength,
																		dosageForm: ex.dosageForm,
																		unit: ex.unit,
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
														<Button
															size="sm"
															variant="ghost"
															onClick={() => {
																setEditingVariant(null)
																setEditVariantLabel("")
															}}
														>
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
															Edit label
														</Button>
														<Button
															size="sm"
															variant="ghost"
															className="text-destructive"
															onClick={async () => {
																if (!editing?.id) return
																try {
																	await variantDeleteMutation.mutateAsync({
																		productId: editing.id,
																		variantId: v.id,
																	})
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
											</div>
											{editingVariant?.id !== v.id && editing?.id ? (
												<div className="border-muted space-y-2 border-t pt-2">
													<div className="space-y-2 sm:col-span-2">
														<div className="space-y-1">
															<p className="text-muted-foreground text-xs font-medium">
																Image gallery
															</p>
															<p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
																Add images with a public URL or a file upload; each image is saved
																to this variant&apos;s gallery as soon as you add it. Unit, strength,
																dosage form, and stock are saved together with{" "}
																<span className="text-foreground/90 font-medium">Save inventory</span>{" "}
																below.
															</p>
														</div>
														{variantGalleryUrls(v).length > 0 ? (
															<ul className="flex flex-col gap-2">
																{variantGalleryUrls(v).map((url, idx) => (
																	<li
																		key={`${v.id}-gal-${idx}-${url.slice(0, 48)}`}
																		className="border-border flex flex-wrap items-center gap-2 rounded-md border bg-background/50 p-2"
																	>
																		<img
																			src={url}
																			alt=""
																			className="border-border h-14 w-14 shrink-0 rounded border object-cover"
																		/>
																		<span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
																			{url}
																		</span>
																		<div className="flex shrink-0 items-center gap-1">
																			<Button
																				type="button"
																				size="icon"
																				variant="outline"
																				className="h-8 w-8"
																				disabled={
																					idx === 0 || variantUpdateMutation.isPending
																				}
																				aria-label="Move image up"
																				onClick={() =>
																					void persistVariantGallery(
																						v,
																						reorderGalleryUrls(variantGalleryUrls(v), idx, -1)
																					)
																				}
																			>
																				<ChevronUp className="h-4 w-4" />
																			</Button>
																			<Button
																				type="button"
																				size="icon"
																				variant="outline"
																				className="h-8 w-8"
																				disabled={
																					idx >= variantGalleryUrls(v).length - 1 ||
																					variantUpdateMutation.isPending
																				}
																				aria-label="Move image down"
																				onClick={() =>
																					void persistVariantGallery(
																						v,
																						reorderGalleryUrls(variantGalleryUrls(v), idx, 1)
																					)
																				}
																			>
																				<ChevronDown className="h-4 w-4" />
																			</Button>
																			<Button
																				type="button"
																				size="icon"
																				variant="outline"
																				className="h-8 w-8 text-destructive"
																				disabled={variantUpdateMutation.isPending}
																				aria-label="Remove image"
																				onClick={() =>
																					void persistVariantGallery(
																						v,
																						variantGalleryUrls(v).filter((_, j) => j !== idx)
																					)
																				}
																			>
																			</Button>
																		</div>
																	</li>
																))}
															</ul>
														) : (
															<p className="text-muted-foreground text-xs">No images yet.</p>
														)}
														<div className="max-w-xl space-y-4">
															<div className="space-y-1.5">
																<Label htmlFor={`add-url-${v.id}`} className="text-xs">
																	Add image URL
																</Label>
																<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
																	<Input
																		id={`add-url-${v.id}`}
																		className="min-w-0 flex-1"
																		placeholder="https://…"
																		value={addGalleryUrlDraft[v.id] ?? ""}
																		onChange={e =>
																			setAddGalleryUrlDraft(prev => ({
																				...prev,
																				[v.id]: e.target.value,
																			}))
																		}
																	/>
																	<Button
																		type="button"
																		size="sm"
																		variant="secondary"
																		className="w-full shrink-0 sm:w-auto"
																		disabled={variantUpdateMutation.isPending}
																		onClick={() => {
																			const raw = (addGalleryUrlDraft[v.id] ?? "").trim()
																			if (!raw) {
																				toast({
																					title: "Enter a URL",
																					variant: "destructive",
																				})
																				return
																			}
																			try {
																				new URL(raw)
																			} catch {
																				toast({
																					title: "Invalid URL",
																					variant: "destructive",
																				})
																				return
																			}
																			const cur = variantGalleryUrls(v)
																			if (cur.includes(raw)) {
																				toast({
																					title: "Already in gallery",
																					variant: "destructive",
																				})
																				return
																			}
																			void persistVariantGallery(v, [...cur, raw])
																			setAddGalleryUrlDraft(prev => ({ ...prev, [v.id]: "" }))
																		}}
																	>
																		Add URL
																	</Button>
																</div>
															</div>
															<div className="border-border space-y-3 border-t pt-4">
																<div
																	className={cn(
																		"space-y-1.5",
																		isImageBusy && "pointer-events-none opacity-70"
																	)}
																>
																	<Label htmlFor={`variant-picture-${v.id}`} className="text-xs">
																		Add picture (upload)
																	</Label>
																	<Input
																		id={`variant-picture-${v.id}`}
																		type="file"
																		accept="image/jpeg,image/png,image/webp,image/gif"
																		className="w-full cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
																		onChange={e => {
																			const f = e.target.files?.[0]
																			if (f) void handleVariantImageFile(v.id, f)
																			e.target.value = ""
																		}}
																	/>
																</div>
															</div>
														</div>
													</div>
													<VariantInventoryEditor
														productId={editing.id}
														variantId={v.id}
														title={`${v.label} — stock & pricing`}
														row={inventoryRowFor(inventoryList, v.id)}
														lowStockThreshold={form.lowStockThreshold ?? editing.lowStockThreshold ?? 5}
														unit={variantExtras[v.id]?.unit ?? "piece"}
														strength={variantExtras[v.id]?.strength ?? ""}
														dosageForm={variantExtras[v.id]?.dosageForm ?? ""}
														onVariantDetailChange={patch =>
															setVariantExtras(prev => ({
																...prev,
																[v.id]: {
																	unit: patch.unit ?? prev[v.id]?.unit ?? "piece",
																	strength: patch.strength ?? prev[v.id]?.strength ?? "",
																	dosageForm: patch.dosageForm ?? prev[v.id]?.dosageForm ?? "",
																},
															}))
														}
														onSaved={() => void queryClient.invalidateQueries({ queryKey: ["inventory"] })}
													/>
												</div>
											) : null}
										</li>
									))}
								</ul>
								<div className="space-y-2 sm:col-span-2">
									<p className="text-muted-foreground text-xs font-medium">Add new variant</p>
									<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
										<div className="space-y-1">
											<Label htmlFor="new-variant-label" className="text-xs">
												Label *
											</Label>
											<Input
												id="new-variant-label"
												value={newVariantLabel}
												onChange={e => setNewVariantLabel(e.target.value)}
												placeholder="e.g. 100 ml bottle"
												onKeyDown={e => {
													if (e.key === "Enter") {
														e.preventDefault()
														void tryAddNewVariant()
													}
												}}
											/>
										</div>
										<div className="space-y-1">
											<Label htmlFor="new-variant-unit" className="text-xs">
												Unit *
											</Label>
											<Input
												id="new-variant-unit"
												value={newVariantUnit}
												onChange={e => setNewVariantUnit(e.target.value)}
												placeholder="e.g. bottle"
											/>
										</div>
										<div className="space-y-1">
											<Label htmlFor="new-variant-strength" className="text-xs">
												Strength
											</Label>
											<Input
												id="new-variant-strength"
												value={newVariantStrength}
												onChange={e => setNewVariantStrength(e.target.value)}
												placeholder="e.g. 500 mg"
											/>
										</div>
										<div className="space-y-1">
											<Label htmlFor="new-variant-dosage" className="text-xs">
												Dosage form
											</Label>
											<Input
												id="new-variant-dosage"
												value={newVariantDosageForm}
												onChange={e => setNewVariantDosageForm(e.target.value)}
												placeholder="e.g. tablet"
											/>
										</div>
									</div>
									<Button size="sm" type="button" onClick={() => void tryAddNewVariant()}>
										Add variant
									</Button>
								</div>
							</div>
						)}
						{!editing ? (
							<>
								<div className="space-y-1 sm:col-span-2">
									<h3 className="text-muted-foreground text-sm font-medium">Initial inventory</h3>
								</div>
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
										placeholder="e.g. LOT-2024-001"
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
										aria-label="Available for sale"
									>
										<option value="true">Yes</option>
										<option value="false">No</option>
									</select>
								</div>
							</>
						) : null}

						<div className="space-y-1 sm:col-span-2">
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								className="border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
								value={form.description ?? ""}
								onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
								rows={3}
								placeholder="Short description, packaging, or notes for staff (optional)"
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

			<AlertDialog
				open={!!productDeleteState}
				onOpenChange={open => !open && setProductDeleteState(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{productDeleteState?.kind === "many"
								? `Delete ${productDeleteState.products.length} products`
								: "Delete product"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{productDeleteState?.kind === "many" ? (
								<>
									Are you sure you want to delete {productDeleteState.products.length} selected
									products? This also removes all related inventory and cannot be undone.
								</>
							) : (
								<>
									Are you sure you want to delete this product? This also deletes all inventory rows for
									this product and cannot be undone.
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => void confirmDelete()}
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

