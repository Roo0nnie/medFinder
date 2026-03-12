"use client";

import React from "react";
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { InventoryTrendsChart } from "../components/DashboardCharts";
import { mockAnalytics, products } from "../data/mockData";

export default function StaffDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Inventory</h1>
        <p className="text-muted-foreground mt-2">Manage products and track stock levels.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <StatCard
          title="Total Products Managed"
          value={products.length * 40} // mock large number
          icon={<Package className="h-4 w-4" />}
          trend={{ value: 1.2, label: "new items", isPositive: true }}
        />
        <StatCard
          title="Items Out of Stock"
          value="3"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          trend={{ value: 3, label: "needs attention", isPositive: false }}
          className="border-destructive/20 bg-destructive/10"
        />
         <StatCard
          title="Low Stock Alerts"
          value="12"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          trend={{ value: 5, label: "new this week", isPositive: false }}
          className="border-amber-500/20 bg-amber-500/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <InventoryTrendsChart data={mockAnalytics.inventoryTrends} />
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 overflow-hidden flex flex-col">
           <h3 className="text-base font-medium text-foreground mb-4">Recent Stock Updates</h3>
           <div className="flex-1 overflow-y-auto space-y-4">
               {products.map((product, i) => (
                    <div key={`update-${i}`} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                        <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {i % 2 === 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{i % 2 === 0 ? 'Stock Replenished' : 'Stock Reduced'}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-semibold text-foreground">{product.stock}</p>
                             <p className="text-xs text-muted-foreground">remaining</p>
                        </div>
                    </div>
               ))}
                {/* duplicate mock items for presentation */}
                {products.map((product, i) => (
                    <div key={`update-2-${i}`} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                        <div className={`p-2 rounded-full ${i % 2 !== 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {i % 2 !== 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{product.name} XL</p>
                            <p className="text-xs text-muted-foreground">{i % 2 !== 0 ? 'Stock Replenished' : 'Stock Reduced'}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-semibold text-foreground">{product.stock - 20}</p>
                             <p className="text-xs text-muted-foreground">remaining</p>
                        </div>
                    </div>
               ))}
           </div>
        </div>
      </div>

       <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
            <h3 className="text-base font-medium text-foreground">Inventory List</h3>
            <div className="flex gap-2">
                 <button className="px-4 py-2 text-sm bg-background border rounded-md shadow-sm font-medium hover:bg-muted">Filter</button>
                 <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md shadow-sm font-medium hover:bg-primary/90">Update Stock</button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-muted-foreground bg-muted uppercase border-b border-border">
                <tr>
                    <th scope="col" className="px-6 py-3">Product Name</th>
                    <th scope="col" className="px-6 py-3">SKU</th>
                    <th scope="col" className="px-6 py-3">Stock Limit</th>
                    <th scope="col" className="px-6 py-3">Current Stock</th>
                    <th scope="col" className="px-6 py-3">Action</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product) => (
                    <tr key={product.id} className="bg-card border-b border-border hover:bg-muted transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{product.name}</td>
                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground">MED-{product.id}00X</td>
                        <td className="px-6 py-4 text-muted-foreground">Min: 50</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {product.stock} units
                            </span>
                        </td>
                         <td className="px-6 py-4">
                            <button className="text-primary hover:text-primary/80 font-medium">Edit</button>
                        </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
