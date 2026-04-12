"use client"

import { useEffect, useMemo, useState } from "react"

import { ProductVariantSelector } from "./product-variant-selector"

import type { ProductDetailVariant } from "./page"

type AvailabilityRow = {
	id: string
	name: string
	address: string
	city: string
	price?: number
	quantity?: number
}

export function ProductMerchColumn({
	productName,
	category,
	brand,
	manufacturer,
	variants,
	defaultPrice,
	availability,
}: {
	productName: string
	category: string | null | undefined
	brand: string | undefined
	manufacturer: string | null | undefined
	variants: ProductDetailVariant[]
	defaultPrice: number | null
	availability: AvailabilityRow[]
}) {
	const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "")
	useEffect(() => {
		const first = variants[0]?.id ?? ""
		if (first && !variants.some(v => v.id === selectedId)) {
			setSelectedId(first)
		}
	}, [variants, selectedId])
	const selected = useMemo(
		() => variants.find(v => v.id === selectedId) ?? variants[0],
		[variants, selectedId]
	)
	const imageSrc = (selected?.imageUrl ?? "").trim() || null
	const dosageLine =
		[selected?.dosageForm, selected?.strength, selected?.unit].filter(Boolean).join(" · ") || null

	return (
		<div className="flex flex-col gap-8 sm:flex-row lg:gap-12">
			{imageSrc ? (
				<div className="bg-muted/30 group relative flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg sm:h-72 sm:w-72">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={imageSrc}
						alt={productName}
						className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-105"
					/>
				</div>
			) : null}
			<div className="flex min-w-0 flex-1 flex-col py-2">
				<div className="flex h-full flex-col justify-between gap-6">
					<div>
						{brand ? (
							<div className="focus:ring-ring mb-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
								{brand}
							</div>
						) : null}
						<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{productName}</h1>

						<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
							{category ? (
								<div>
									<span className="text-muted-foreground">Category: </span>
									<span className="text-foreground font-medium">{category}</span>
								</div>
							) : null}
							{dosageLine ? (
								<div>
									<span className="text-muted-foreground">Dosage: </span>
									<span className="text-foreground font-medium">{dosageLine}</span>
								</div>
							) : null}
							{manufacturer ? (
								<div>
									<span className="text-muted-foreground">Manufacturer: </span>
									<span className="text-foreground font-medium">{manufacturer}</span>
								</div>
							) : null}
						</div>
					</div>
					<div className="border-t pt-6">
						<ProductVariantSelector
							variants={variants}
							defaultPrice={defaultPrice}
							availability={availability}
							selectedId={selectedId}
							onSelectedIdChange={setSelectedId}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
