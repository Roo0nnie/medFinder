"use client";

import React from "react";
import { Users, Store, Activity, MessageSquare } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { MonthlySalesChart, TopProductsChart } from "../components/DashboardCharts";
import { mockAnalytics, users, pharmacies } from "../data/mockData";

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor entire platform metrics and activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={users.length * 1250} // mock large number
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, label: "vs last month", isPositive: true }}
        />
         <StatCard
          title="Total Pharmacies"
          value={pharmacies.length * 45} // mock
          icon={<Store className="h-4 w-4" />}
          trend={{ value: 5.4, label: "vs last month", isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: 20.1, label: "vs last month", isPositive: true }}
        />
        <StatCard
          title="Total Reviews"
          value="12,234"
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{ value: 4, label: "vs last month", isPositive: false }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <MonthlySalesChart data={mockAnalytics.monthlySales} />
        </div>
        <div className="lg:col-span-3">
          <TopProductsChart data={mockAnalytics.topProducts} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 p-6">
          <h3 className="text-base font-medium text-foreground">Recent Users</h3>
          <button className="text-sm font-medium text-primary hover:text-primary/80">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-muted-foreground bg-muted uppercase border-b border-border">
                <tr>
                    <th scope="col" className="px-6 py-3">User Name</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                    <tr key={user.id} className="bg-card border-b border-border hover:bg-muted transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{user.name}</td>
                        <td className="px-6 py-4 capitalize">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Active
                            </span>
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
