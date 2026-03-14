"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"
import { Separator } from "@/core/components/ui/separator"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function StaffSettingsPage() {
	return (
		<DashboardLayout role="staff">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Settings</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Manage your staff dashboard preferences and notifications.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Dashboard</CardTitle>
						<CardDescription>How your dashboard and lists behave.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="staff-compact-view" className="flex flex-col space-y-0.5">
								<span>Compact view</span>
								<span className="text-muted-foreground font-normal text-xs">
									Show more rows per page in product and stock tables.
								</span>
							</Label>
							<Switch id="staff-compact-view" />
						</div>
						<Separator />
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="staff-default-stock" className="flex flex-col space-y-0.5">
								<span>Default to stock alerts</span>
								<span className="text-muted-foreground font-normal text-xs">
									Open stock alerts by default when entering the dashboard.
								</span>
							</Label>
							<Switch id="staff-default-stock" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Stock & inventory</CardTitle>
						<CardDescription>Alerts and reminders for inventory tasks.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="staff-stock-alerts" className="flex flex-col space-y-0.5">
								<span>Stock alert notifications</span>
								<span className="text-muted-foreground font-normal text-xs">
									Get notified when items are low in stock.
								</span>
							</Label>
							<Switch id="staff-stock-alerts" defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="staff-daily-reminder" className="flex flex-col space-y-0.5">
								<span>Daily inventory reminder</span>
								<span className="text-muted-foreground font-normal text-xs">
									Remind you to review inventory at the start of your shift.
								</span>
							</Label>
							<Switch id="staff-daily-reminder" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Notifications</CardTitle>
						<CardDescription>Email and in-app notification preferences.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="staff-email-notifications" className="flex flex-col space-y-0.5">
								<span>Email notifications</span>
								<span className="text-muted-foreground font-normal text-xs">
									Receive important updates and alerts by email.
								</span>
							</Label>
							<Switch id="staff-email-notifications" defaultChecked />
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
