"use client"

import { useState } from "react"

import type { ProductDetailVariant } from "./page"

type AvailabilityRow = {
	id: string
	name: string
	address: string
	city: string
	price?: number
	quantity?: number
}

export function ProductVariantSelector({
	variants,
	defaultPrice,
	availability,
}: {
	variants: ProductDetailVariant[]
	defaultPrice: number | null
	availability: AvailabilityRow[]
}) {
	const hasMultiple = variants.length > 1
	const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "")
	const selected = variants.find(v => v.id === selectedId) ?? variants[0]
	const displayPrice = selected?.price ?? defaultPrice ?? 0

	return (
		<div className="space-y-3">
			{hasMultiple && (
				<div>
					<label htmlFor="product-variant" className="text-muted-foreground mb-1 block text-sm font-medium">
						Size / variant
					</label>
					<select
						id="product-variant"
						value={selectedId}
						onChange={e => setSelectedId(e.target.value)}
						className="border-input text-foreground focus:ring-ring w-full max-w-xs rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none"
					>
						{variants.map(v => (
							<option key={v.id} value={v.id}>
								{v.label}
								{typeof v.price === "number" ? ` — ₱${v.price.toFixed(2)}` : ""}
								{typeof v.quantity === "number" ? ` (${v.quantity} in stock)` : ""}
							</option>
						))}
					</select>
				</div>
			)}
			<p className="text-foreground text-3xl font-bold tracking-tight">
				{hasMultiple ? "From " : ""}₱{displayPrice.toFixed(2)}
			</p>
			{typeof selected?.quantity === "number" && (
				<p className="text-muted-foreground text-sm">
					{selected.quantity} in stock
					{selected.lowStockThreshold != null && selected.quantity <= selected.lowStockThreshold && (
						<span className="text-amber-600 dark:text-amber-400"> (low stock)</span>
					)}
				</p>
			)}
		</div>
	)
}
