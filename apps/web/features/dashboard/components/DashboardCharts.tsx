"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlySalesChartProps {
  data: { name: string; sales: number }[];
}

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  return (
    <div className="h-[300px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-medium text-foreground mb-6">Sales by Month</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Bar
            dataKey="sales"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface InventoryTrendsChartProps {
  data: { day: string; stock: number }[];
}

export function InventoryTrendsChart({ data }: InventoryTrendsChartProps) {
  return (
    <div className="h-[300px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-medium text-foreground mb-6">Inventory Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="day"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Line
            type="monotone"
            dataKey="stock"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ strokeWidth: 2, r: 4, fill: "hsl(var(--background))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TopProductsChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent))",
];

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <div className="h-[300px] w-full rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
       <h3 className="text-base font-medium text-foreground mb-2 w-full text-left">Top Products</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 flex-wrap justify-center mt-2">
         {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name}
            </div>
         ))}
      </div>
    </div>
  );
}
