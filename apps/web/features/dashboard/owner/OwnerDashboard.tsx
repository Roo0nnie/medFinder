"use client"

import React from "react"
import { Activity, AlertTriangle, Package, Store } from "lucide-react"

import { InventoryTrendsChart, MonthlySalesChart } from "../components/DashboardCharts"
import { StatCard } from "../components/StatCard"
import { mockAnalytics, pharmacies, products } from "../data/mockData"

export default function OwnerDashboard() {
	return (
		<div className="animate-in fade-in zoom-in-95 space-y-8 duration-500">
			<div>
				<h1 className="text-foreground text-3xl font-bold tracking-tight">Owner Dashboard</h1>
				<p className="text-muted-foreground mt-2">Manage your pharmacies, staff, and inventory.</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="My Pharmacies"
					value={pharmacies.length}
					icon={<Store className="h-4 w-4" />}
				/>
				<StatCard
					title="Total Products"
					value={products.length * 150} // mock large number
					icon={<Package className="h-4 w-4" />}
					trend={{ value: 2.4, label: "vs last month", isPositive: true }}
				/>
				<StatCard
					title="Monthly Revenue"
					value="$12,450.00"
					icon={<Activity className="h-4 w-4" />}
					trend={{ value: 14.2, label: "vs last month", isPositive: true }}
				/>
				<StatCard
					title="Low Stock Alerts"
					value="12"
					icon={<AlertTriangle className="h-4 w-4" />}
					trend={{ value: 5, label: "new this week", isPositive: false }}
					className="border-amber-500/20 bg-amber-500/10"
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
				<MonthlySalesChart data={mockAnalytics.monthlySales} />
				<InventoryTrendsChart data={mockAnalytics.inventoryTrends} />
			</div>

			<div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
				<div className="border-border flex items-center justify-between border-b p-6">
					<h3 className="text-foreground text-base font-medium">Top Selling Products</h3>
					<button className="text-primary hover:text-primary/80 text-sm font-medium">
						View All
					</button>
				</div>
				<div className="overflow-x-auto">
					<table className="text-muted-foreground w-full text-left text-sm">
						<thead className="text-muted-foreground bg-muted border-border border-b text-xs uppercase">
							<tr>
								<th scope="col" className="px-6 py-3">
									Product Name
								</th>
								<th scope="col" className="px-6 py-3">
									Price
								</th>
								<th scope="col" className="px-6 py-3">
									Stock Left
								</th>
								<th scope="col" className="px-6 py-3">
									Sold (Month)
								</th>
							</tr>
						</thead>
						<tbody>
							{products.map(product => (
								<tr
									key={product.id}
									className="bg-card border-border hover:bg-muted border-b transition-colors"
								>
									<td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
										{product.name}
									</td>
									<td className="px-6 py-4">${product.price.toFixed(2)}</td>
									<td className="px-6 py-4">
										<span
											className={`rounded-full px-2 py-1 text-xs font-medium ${product.stock > 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
										>
											{product.stock} units
										</span>
									</td>
									<td className="text-foreground px-6 py-4 font-semibold">{product.soldMonth}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
