"use client"

import { Activity, BadgeCheck, BadgeX, FileClock, MessageSquare, Store, Users } from "lucide-react"

import { StatCard } from "../components/StatCard"
import { ReviewRatingsLineChart, TopProductsChart } from "../components/DashboardCharts"
import { useAdminAnalyticsDashboardQuery } from "@/features/admin/api/admin.hooks"

export default function AdminDashboard() {
	const q = useAdminAnalyticsDashboardQuery()

	const kpis = q.data?.kpis
	const pipeline = q.data?.certificatePipeline

	return (
		<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Admin dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Platform-wide metrics across all pharmacies, products, reservations, certificates, and reviews.
				</p>
			</div>

			{q.isLoading ? (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 9 }).map((_, i) => (
						<div key={i} className="bg-muted/40 h-28 animate-pulse rounded-xl border border-border" />
					))}
				</div>
			) : q.isError || !kpis ? (
				<div className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
					Failed to load admin dashboard.
				</div>
			) : (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard title="Total users" value={kpis.usersTotal} icon={<Users className="h-4 w-4" />} />
					<StatCard
						title="Total pharmacies"
						value={kpis.pharmaciesTotal}
						icon={<Store className="h-4 w-4" />}
					/>
					<StatCard
						title="Total products"
						value={kpis.productsTotal}
						icon={<Activity className="h-4 w-4" />}
					/>
					
					<StatCard
						title="Certificates pending"
						value={pipeline?.pending ?? 0}
						icon={<FileClock className="h-4 w-4" />}
					/>
					<StatCard
						title="Certificates approved"
						value={pipeline?.approved ?? 0}
						icon={<BadgeCheck className="h-4 w-4" />}
					/>
					<StatCard
						title="Certificates rejected"
						value={pipeline?.rejected ?? 0}
						icon={<BadgeX className="h-4 w-4" />}
					/>
				</div>
			)}

			<div className="space-y-6">
				<div className="grid gap-6 lg:grid-cols-2">
					<TopProductsChart
						data={q.data?.topProductViews ?? []}
						title="Product views"
						subtitle="Counted when customers open a product from a pharmacy page or browse the full product page."
					/>
					<TopProductsChart
						data={q.data?.topProducts ?? []}
						title="Top products"
						subtitle="Ranked by inventory presence (platform-wide)."
					/>
				</div>
				<div className="grid gap-6 lg:grid-cols-2">
					<TopProductsChart
						data={q.data?.topCategories ?? []}
						title="Top categories"
						subtitle="Ranked by product counts (platform-wide)."
					/>
					<ReviewRatingsLineChart
						data={q.data?.reviewDistribution ?? []}
						title="Reviews by star rating"
						subtitle="Pharmacy + product reviews combined (platform-wide)."
					/>
				</div>
			</div>
		</div>
	)
}
