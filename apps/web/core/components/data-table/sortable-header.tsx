"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/core/components/ui/button"

type SortableColumnLike = {
	getCanSort: () => boolean
	getIsSorted: () => false | "asc" | "desc"
	toggleSorting: (desc?: boolean) => void
}

export function SortableHeader({ column, label }: { column: SortableColumnLike; label: string }) {
	const sorted = column.getIsSorted()
	const canSort = column.getCanSort()

	if (!canSort) return <span>{label}</span>

	return (
		<Button
			type="button"
			variant="ghost"
			className="-ml-3 h-8 px-3 text-xs font-semibold"
			onClick={() => column.toggleSorting(sorted === "asc")}
		>
			<span>{label}</span>
			<span className="ml-2 inline-flex h-4 w-4 items-center justify-center">
				{sorted === "asc" ? (
					<ChevronUp className="h-4 w-4" />
				) : sorted === "desc" ? (
					<ChevronDown className="h-4 w-4" />
				) : (
					<span className="flex flex-col leading-none opacity-40">
						<ChevronUp className="-mb-1 h-3 w-3" />
						<ChevronDown className="-mt-1 h-3 w-3" />
					</span>
				)}
			</span>
		</Button>
	)
}

