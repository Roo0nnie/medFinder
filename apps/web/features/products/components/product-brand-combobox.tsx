"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/core/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover"
import { useToast } from "@/core/components/ui/use-toast"
import { cn } from "@/core/lib/utils"
import {
	useBrandCreateMutation,
	useBrandsSearchQuery,
	useMyBrandsQuery,
	type Brand,
} from "@/features/brands/api/brands.hooks"

export type BrandSelection = {
	brandId: string | null | undefined
	brandName: string
}

type ProductBrandComboboxProps = {
	value: BrandSelection
	onChange: (next: BrandSelection) => void
	disabled?: boolean
}

function mergeUniqueById(a: Brand[], b: Brand[]): Brand[] {
	const map = new Map<string, Brand>()
	for (const x of a) map.set(x.id, x)
	for (const x of b) map.set(x.id, x)
	return [...map.values()]
}

export function ProductBrandCombobox({ value, onChange, disabled }: ProductBrandComboboxProps) {
	const { toast } = useToast()
	const [open, setOpen] = useState(false)
	const [q, setQ] = useState("")
	const [debounced, setDebounced] = useState("")

	useEffect(() => {
		const t = setTimeout(() => setDebounced(q), 280)
		return () => clearTimeout(t)
	}, [q])

	const mineQuery = useMyBrandsQuery(open)
	const searchQuery = useBrandsSearchQuery(debounced, 30, open && debounced.trim().length > 0)

	const merged = useMemo(() => {
		const mine = mineQuery.data ?? []
		const hit = searchQuery.data ?? []
		return mergeUniqueById(mine, hit).sort((x, y) => x.name.localeCompare(y.name))
	}, [mineQuery.data, searchQuery.data])

	const displayLabel =
		value.brandName?.trim() ||
		(value.brandId && merged.find(b => b.id === value.brandId)?.name) ||
		""

	const createMutation = useBrandCreateMutation()

	const trimmed = q.trim()
	const nameExists = merged.some(b => b.name.trim().toLowerCase() === trimmed.toLowerCase())

	const selectBrand = (b: Brand) => {
		onChange({ brandId: b.id, brandName: b.name })
		setOpen(false)
		setQ("")
	}

	const createAndLink = async () => {
		if (!trimmed) return
		try {
			const created = await createMutation.mutateAsync({ name: trimmed })
			onChange({ brandId: created.id, brandName: created.name })
			setOpen(false)
			setQ("")
		} catch (e) {
			toast({
				title: "Could not create brand",
				description: e instanceof Error ? e.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					"border-input bg-background ring-offset-background inline-flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs outline-none",
					"focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
					disabled && "pointer-events-none opacity-50"
				)}
				disabled={disabled}
			>
				<span className="truncate">{displayLabel || "Select brand…"}</span>
				<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput placeholder="Search or create…" value={q} onValueChange={setQ} />
					<CommandList>
						<CommandEmpty>No matches.</CommandEmpty>
						<CommandGroup heading="Brands">
							{merged.map(b => (
								<CommandItem
									key={b.id}
									value={b.id}
									onSelect={() => selectBrand(b)}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value.brandId === b.id ? "opacity-100" : "opacity-0"
										)}
									/>
									{b.name}
								</CommandItem>
							))}
						</CommandGroup>
						{trimmed && !nameExists && (
							<CommandGroup heading="New">
								<CommandItem
									value={`__create__${trimmed}`}
									onSelect={() => void createAndLink()}
								>
									Create &amp; link &quot;{trimmed}&quot;
								</CommandItem>
							</CommandGroup>
						)}
					</CommandList>
				</Command>
				<div className="border-border border-t p-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full"
						onClick={() => {
							onChange({ brandId: null, brandName: "" })
							setOpen(false)
							setQ("")
						}}
					>
						Clear brand
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
