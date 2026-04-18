"use client"

import {
	AlertTriangle,
	FileQuestion,
	FolderTree,
	Layers,
	Package,
	PackageX,
	Tag,
	UserCheck,
	UserX,
} from "lucide-react"

import type { OwnerStats } from "@repo/contracts"

import { StatCard } from "./StatCard"

export function OwnerDashboardStatGrid({
	stats,
	isLoading,
	error,
}: {
	stats: OwnerStats | undefined
	isLoading: boolean
	error: Error | null
}) {
	if (isLoading) {
		return (
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					<div
						key={i}
						className="bg-muted/40 h-28 animate-pulse rounded-xl border border-border"
					/>
				))}
			</div>
		)
	}

	if (error || !stats) {
		return (
			<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
				{error?.message ?? "Could not load dashboard statistics."}
			</div>
		)
	}

	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				title="Products & variants"
				value={stats.productsAndVariantsCount}
				icon={<Layers className="h-4 w-4" />}
			/>
			<StatCard
				title="Categories"
				value={stats.categoriesCount}
				icon={<FolderTree className="h-4 w-4" />}
			/>
			<StatCard
				title="Brands (linked)"
				value={stats.brandsCount}
				icon={<Tag className="h-4 w-4" />}
			/>
			<StatCard
				title="Staff (active)"
				value={stats.staffActiveCount}
				icon={<UserCheck className="h-4 w-4" />}
			/>
			<StatCard
				title="Staff (inactive)"
				value={stats.staffInactiveCount}
				icon={<UserX className="h-4 w-4" />}
			/>
			<StatCard
				title="In stock (OK)"
				value={stats.inventoryInStockCount}
				icon={<Package className="h-4 w-4" />}
			/>
			<StatCard
				title="Low stock"
				value={stats.inventoryLowStockCount}
				icon={<AlertTriangle className="h-4 w-4" />}
			/>
			<StatCard
				title="Out of stock"
				value={stats.inventoryOutOfStockCount}
				icon={<PackageX className="h-4 w-4" />}
			/>
			<StatCard
				title="Pending deletion requests"
				value={stats.pendingDeletionRequestsCount}
				icon={<FileQuestion className="h-4 w-4" />}
			/>
		</div>
	)
}
