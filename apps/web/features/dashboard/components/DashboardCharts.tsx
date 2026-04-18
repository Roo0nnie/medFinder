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
  title?: string;
  subtitle?: string;
}

export function MonthlySalesChart({ data, title = "Sales by Month", subtitle }: MonthlySalesChartProps) {
  if (!data.length) {
    return (
      <div className="min-h-[200px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">No completed reservations in range yet.</p>
      </div>
    );
  }
  return (
    <div className="h-[300px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
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

interface SearchTrendsLineChartProps {
  data: { name: string; count: number }[];
  title?: string;
  subtitle?: string;
}

export function SearchTrendsLineChart({
  data,
  title = "Search activity",
  subtitle,
}: SearchTrendsLineChartProps) {
  if (!data.length) {
    return (
      <div className="min-h-[200px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">No search data in this range yet.</p>
      </div>
    );
  }
  return (
    <div className="h-[340px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 48 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickMargin={14}
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, dy: -5 }}
          />
          <Tooltip
            formatter={(value: number) => [value, "Searches"]}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ strokeWidth: 2, r: 3, fill: "hsl(var(--background))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PeakHoursBarChartProps {
  data: { hour: number; count: number }[];
  title?: string;
  subtitle?: string;
}

export function PeakHoursBarChart({
  data,
  title = "Peak search hours",
  subtitle,
}: PeakHoursBarChartProps) {
  const chartData = data.map((d) => ({
    label: `${d.hour}`,
    count: d.count,
  }));
  return (
    <div className="h-[360px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -12, bottom: 58 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickMargin={12}
            dy={10}
            interval={2}
            label={{
              value: "Hour (0–23)",
              position: "bottom",
              offset: 6,
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, dy: -5 }}
          />
          <Tooltip
            formatter={(value: number) => [value, "Searches"]}
            labelFormatter={(label) => `Hour ${label}`}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ReviewRatingsLineChartProps {
  data: { name: string; value: number }[];
  title?: string;
  subtitle?: string;
}

export function ReviewRatingsLineChart({
  data,
  title = "Reviews by star rating",
  subtitle,
}: ReviewRatingsLineChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="h-[350px] w-full rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
        {total === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">No reviews yet for your pharmacies and products.</p>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 52 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="name"
            tickFormatter={(v) => `${v}★`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickMargin={16}
            dy={12}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, dy: -5 }}
          />
          <Tooltip
            labelFormatter={(label) => `Rating ${label}★`}
            formatter={(value: number) => [value, "Reviews"]}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
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
  title?: string;
  subtitle?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent))",
];

export function TopProductsChart({
  data,
  title = "Top products",
  subtitle,
}: TopProductsChartProps) {
  if (!data.length) {
    return (
      <div className="flex min-h-[200px] w-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-2 w-full text-left">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          No data yet.
        </p>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col items-stretch rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-2 w-full text-left">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
      <div className="mx-auto h-[220px] w-full max-w-[280px]">
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
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid w-full grid-cols-2 gap-x-6 gap-y-2.5 text-left">
        {data.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className="text-muted-foreground flex min-w-0 items-start gap-2 text-xs"
          >
            <span
              className="mt-0.5 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="min-w-0 wrap-break-word leading-snug">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
