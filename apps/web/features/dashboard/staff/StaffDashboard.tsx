"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Package } from "lucide-react";

import { Button } from "@/core/components/ui/button";

import { useStaffDashboardQuery } from "../api/analytics.hooks";
import { InventoryTrendsChart } from "../components/DashboardCharts";
import { StatCard } from "../components/StatCard";

type StockStatus = "ok" | "low" | "out" | "unavailable";
type UpdateDirection = "increase" | "decrease" | "update";

function formatDateTime(value: string) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}

function updateMeta(direction: UpdateDirection) {
	if (direction === "increase") {
		return {
			icon: <ArrowUpRight className="h-4 w-4" />,
			label: "Stock replenished",
			iconClassName: "bg-emerald-500/10 text-emerald-500",
		};
	}
	if (direction === "decrease") {
		return {
			icon: <ArrowDownRight className="h-4 w-4" />,
			label: "Stock reduced",
			iconClassName: "bg-red-500/10 text-red-500",
		};
	}
	return {
		icon: <ArrowRight className="h-4 w-4" />,
		label: "Stock updated",
		iconClassName: "bg-slate-500/10 text-slate-500",
	};
}

function stockBadgeClass(status: StockStatus) {
	if (status === "out") return "bg-red-500/10 text-red-500";
	if (status === "unavailable") return "bg-slate-500/10 text-slate-500";
	if (status === "low") return "bg-amber-500/10 text-amber-500";
	return "bg-emerald-500/10 text-emerald-500";
}

function stockLabel(status: StockStatus) {
	if (status === "out") return "Out of stock";
	if (status === "unavailable") return "Not for sale";
	if (status === "low") return "Low stock";
	return "In stock";
}

function CardSkeleton({ className = "" }: { className?: string }) {
	return <div className={`h-28 animate-pulse rounded-xl border border-border bg-muted/40 ${className}`} />;
}

export default function StaffDashboard() {
	const router = useRouter();
	const dashboardQuery = useStaffDashboardQuery();
	const data = dashboardQuery.data;

	return (
		<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Inventory</h1>
				<p className="text-muted-foreground mt-2">
					Live stock health and recent inventory activity across your owner&apos;s pharmacies.
				</p>
			</div>

			{dashboardQuery.error ? (
				<div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
					{dashboardQuery.error instanceof Error
						? dashboardQuery.error.message
						: "Could not load the staff dashboard."}
				</div>
			) : null}

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{dashboardQuery.isLoading ? (
					Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)
				) : (
					<>
						<StatCard
							title="Total Products Managed"
							value={data?.stats.totalProductsManaged ?? 0}
							icon={<Package className="h-4 w-4" />}
						/>
						<StatCard
							title="Items Out of Stock"
							value={data?.stats.itemsOutOfStock ?? 0}
							icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
							className="border-destructive/20 bg-destructive/10"
						/>
						<StatCard
							title="Low Stock Alerts"
							value={data?.stats.lowStockAlerts ?? 0}
							icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
							className="border-amber-500/20 bg-amber-500/10"
						/>
					</>
				)}
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<div className="lg:col-span-2">
					{dashboardQuery.isLoading ? (
						<CardSkeleton className="h-[300px]" />
					) : (
						<InventoryTrendsChart
							data={data?.trend ?? []}
							title="Inventory Activity"
							subtitle="Daily create, update, and delete actions from the last 7 days."
						/>
					)}
				</div>

				<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
					<h3 className="mb-4 text-base font-medium text-foreground">Recent Stock Updates</h3>
					<div className="flex-1 space-y-4 overflow-y-auto">
						{dashboardQuery.isLoading ? (
							Array.from({ length: 5 }).map((_, index) => (
								<div
									key={index}
									className="h-20 animate-pulse rounded-lg border border-border bg-muted/40"
								/>
							))
						) : (data?.recentUpdates.length ?? 0) > 0 ? (
							data?.recentUpdates.map(update => {
								const meta = updateMeta(update.direction);
								return (
									<div
										key={update.id}
										className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
									>
										<div className={`rounded-full p-2 ${meta.iconClassName}`}>{meta.icon}</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-foreground">
												{update.productName}
												{update.variantLabel ? ` - ${update.variantLabel}` : ""}
											</p>
											<p className="text-xs text-muted-foreground">{meta.label}</p>
											<p className="text-xs text-muted-foreground">
												{formatDateTime(update.updatedAt)}
											</p>
										</div>
										<div className="text-right">
											<p className="text-sm font-semibold text-foreground">
												{update.currentQuantity ?? "-"}
											</p>
											<p className="text-xs text-muted-foreground">current</p>
										</div>
									</div>
								);
							})
						) : (
							<div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
								No recent inventory activity yet.
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex items-center justify-between border-b border-border bg-muted/50 p-6">
					<h3 className="text-base font-medium text-foreground">Inventory List</h3>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => router.push("/dashboard/staff/stock-alerts")}
						>
							Filter
						</Button>
						<Button onClick={() => router.push("/dashboard/staff/stock-alerts")}>
							Update Stock
						</Button>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm text-muted-foreground">
						<thead className="border-b border-border bg-muted text-xs text-muted-foreground uppercase">
							<tr>
								<th scope="col" className="px-6 py-3">
									Product Name
								</th>
								<th scope="col" className="px-6 py-3">
									SKU
								</th>
								<th scope="col" className="px-6 py-3">
									Stock Limit
								</th>
								<th scope="col" className="px-6 py-3">
									Current Stock
								</th>
								<th scope="col" className="px-6 py-3">
									Action
								</th>
							</tr>
						</thead>
						<tbody>
							{dashboardQuery.isLoading ? (
								Array.from({ length: 5 }).map((_, index) => (
									<tr key={index} className="border-b border-border">
										<td colSpan={5} className="px-6 py-4">
											<div className="h-10 animate-pulse rounded bg-muted/40" />
										</td>
									</tr>
								))
							) : (data?.inventoryList.length ?? 0) > 0 ? (
								data?.inventoryList.map(item => (
									<tr
										key={item.id}
										className="border-b border-border bg-card transition-colors hover:bg-muted"
									>
										<td className="px-6 py-4 font-medium whitespace-nowrap text-foreground">
											<div>{item.productName}</div>
											{item.variantLabel ? (
												<div className="text-xs font-normal text-muted-foreground">
													{item.variantLabel}
												</div>
											) : null}
										</td>
										<td className="px-6 py-4 font-mono text-xs text-muted-foreground">
											{item.sku}
										</td>
										<td className="px-6 py-4 text-muted-foreground">
											Min: {item.stockLimit}
										</td>
										<td className="px-6 py-4">
											<span
												className={`rounded-full px-2 py-1 text-xs font-medium ${stockBadgeClass(item.stockStatus)}`}
												title={stockLabel(item.stockStatus)}
											>
												{item.currentStock} units
											</span>
										</td>
										<td className="px-6 py-4">
											<button
												type="button"
												onClick={() => router.push("/dashboard/staff/stock-alerts")}
												className="font-medium text-primary hover:text-primary/80"
											>
												Manage
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
										No inventory records found for this dashboard yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
