"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"

type PaginationControls = {
	pageIndex: number
	pageSize: number
	onPageIndexChange: (next: number) => void
	onPageSizeChange: (next: number) => void
}

export type DataTableProps<TData> = {
	data: TData[]
	columns: ColumnDef<TData>[]

	/** Optional top-right / top-left extra controls (filters, selects, etc). */
	toolbarRight?: ReactNode
	toolbarLeft?: ReactNode

	searchPlaceholder?: string
	debounceMs?: number
	onDebouncedSearchChange?: (value: string) => void

	isLoading?: boolean
	errorText?: string | null

	/**
	 * When true, the table assumes the backend provides paginated data and requires `totalCount`.
	 * In this mode, the internal row model uses the provided `data` as already paginated.
	 */
	manualPagination?: boolean
	totalCount?: number
	pagination?: PaginationControls
	pageSizeOptions?: number[]
}

export function DataTable<TData>({
	data,
	columns,
	toolbarLeft,
	toolbarRight,
	searchPlaceholder = "Search...",
	debounceMs = 300,
	onDebouncedSearchChange,
	isLoading,
	errorText,
	manualPagination = false,
	totalCount,
	pagination,
	pageSizeOptions = [5, 10, 20],
}: DataTableProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([])
	const [rowSelection, setRowSelection] = useState({})
	const [searchInput, setSearchInput] = useState("")
	const [globalFilter, setGlobalFilter] = useState("")

	const [internalPageSize, setInternalPageSize] = useState(10)
	const [internalPageIndex, setInternalPageIndex] = useState(0)

	const pageSize = pagination?.pageSize ?? internalPageSize
	const pageIndex = pagination?.pageIndex ?? internalPageIndex

	const setPageSize = (next: number) => {
		if (pagination) pagination.onPageSizeChange(next)
		else setInternalPageSize(next)
	}

	const setPageIndex = (next: number) => {
		if (pagination) pagination.onPageIndexChange(next)
		else setInternalPageIndex(next)
	}

	useEffect(() => {
		const timeout = setTimeout(() => {
			setGlobalFilter(searchInput)
			onDebouncedSearchChange?.(searchInput)
		}, debounceMs)
		return () => clearTimeout(timeout)
	}, [searchInput, debounceMs, onDebouncedSearchChange])

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: {
			sorting,
			rowSelection,
			globalFilter,
			pagination: { pageIndex, pageSize },
		},
		manualPagination,
		pageCount:
			manualPagination && typeof totalCount === "number"
				? Math.ceil(totalCount / pageSize) || 0
				: undefined,
	})

	const filteredRowCount = table.getFilteredRowModel().rows.length
	const effectiveTotalCount = useMemo(() => {
		if (manualPagination) return typeof totalCount === "number" ? totalCount : data.length
		return filteredRowCount
	}, [manualPagination, totalCount, data.length, filteredRowCount])

	const pageCount = table.getPageCount()
	const currentPage = pageIndex + 1

	const showingFrom = effectiveTotalCount > 0 ? pageIndex * pageSize + 1 : 0
	const showingTo =
		effectiveTotalCount > 0 ? Math.min((pageIndex + 1) * pageSize, effectiveTotalCount) : 0

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">Show</span>
						<Select
							value={String(pageSize)}
							onValueChange={value => {
								const next = Number(value)
								setPageSize(next)
								setPageIndex(0)
							}}
						>
							<SelectTrigger className="h-8 w-16">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{pageSizeOptions.map(size => (
									<SelectItem key={size} value={String(size)}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<span className="text-muted-foreground text-sm">entries</span>
					</div>
					{toolbarLeft ? <div className="min-w-0">{toolbarLeft}</div> : null}
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					{toolbarRight ? <div className="min-w-0">{toolbarRight}</div> : null}
					<Input
						placeholder={searchPlaceholder}
						value={searchInput}
						onChange={e => {
							setSearchInput(e.target.value)
							setPageIndex(0)
						}}
						className="h-8 w-full sm:w-64"
					/>
				</div>
			</div>

			{isLoading ? <p className="text-muted-foreground text-xs">Loading...</p> : null}
			{errorText ? <p className="text-destructive text-sm">{errorText}</p> : null}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-sm text-pretty">
					{effectiveTotalCount > 0 ? (
						<>
							Showing {showingFrom} to {showingTo} of {effectiveTotalCount}
						</>
					) : (
						"No data to display"
					)}
				</p>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPageIndex(Math.max(pageIndex - 1, 0))}
						disabled={pageIndex === 0}
						aria-label="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Previous page</span>
					</Button>

					{Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
						<Button
							key={page}
							variant={currentPage === page ? "default" : "outline"}
							size="icon"
							className="h-8 w-8"
							onClick={() => setPageIndex(page - 1)}
							aria-label={`Go to page ${page}`}
						>
							{page}
						</Button>
					))}

					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPageIndex(Math.min(pageIndex + 1, Math.max(pageCount - 1, 0)))}
						disabled={pageIndex >= pageCount - 1 || pageCount === 0}
						aria-label="Next page"
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Next page</span>
					</Button>
				</div>
			</div>
		</div>
	)
}

