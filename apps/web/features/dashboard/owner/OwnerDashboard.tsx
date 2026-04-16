"use client";

import React from "react";
import Link from "next/link";
import { Activity, Package, Store, AlertTriangle } from "lucide-react";

import { InventoryTrendsChart, MonthlySalesChart, TopProductsChart } from "../components/DashboardCharts";
import { StatCard } from "../components/StatCard";
import { mockAnalytics, pharmacies, products } from "../data/mockData";

export default function OwnerDashboard() {
  const lowStockCount = products.filter((p) => p.stock <= 75).length;
  const totalProducts = products.length * 150; // mock large number

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Owner Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your pharmacies, staff, and products.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Pharmacies" value={pharmacies.length} icon={<Store className="h-4 w-4" />} />
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4" />}
          trend={{ value: 2.4, label: "vs last month", isPositive: true }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{ value: 6.1, label: "vs last week", isPositive: false }}
        />
        <StatCard
          title="Monthly Revenue"
          value="$12,450.00"
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: 14.2, label: "vs last month", isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <MonthlySalesChart data={mockAnalytics.monthlySales} />
        </div>
        <div className="lg:col-span-3">
          <InventoryTrendsChart data={mockAnalytics.inventoryTrends} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-3">
          <TopProductsChart data={mockAnalytics.topProducts} />
        </div>
        <div className="lg:col-span-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 p-6">
            <h3 className="text-base font-medium text-foreground">Top Selling Products</h3>
            <Link
              href="/dashboard/owner/products"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-muted-foreground bg-muted uppercase border-b border-border">
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
                {products.map((product) => {
                  const isHealthyStock = product.stock > 100;
                  const isLowStock = product.stock <= 75;

                  return (
                    <tr
                      key={product.id}
                      className="bg-card border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={[
                            "rounded-full px-2.5 py-0.5 text-xs font-medium border",
                            isHealthyStock
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : isLowStock
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          ].join(" ")}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{product.soldMonth}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
