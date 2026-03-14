"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"
import { Separator } from "@/core/components/ui/separator"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerSettingsPage() {
	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Owner Settings</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Manage your pharmacy business settings and preferences.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Business</CardTitle>
						<CardDescription>Settings for your pharmacies and listings.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="owner-visibility" className="flex flex-col space-y-0.5">
								<span>Public visibility</span>
								<span className="text-muted-foreground font-normal text-xs">
									Show your pharmacies in search and catalog.
								</span>
							</Label>
							<Switch id="owner-visibility" defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="owner-stock-alerts" className="flex flex-col space-y-0.5">
								<span>Low stock alerts</span>
								<span className="text-muted-foreground font-normal text-xs">
									Get notified when product stock falls below threshold.
								</span>
							</Label>
							<Switch id="owner-stock-alerts" defaultChecked />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reviews & ratings</CardTitle>
						<CardDescription>How reviews and ratings are handled.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="owner-review-notifications" className="flex flex-col space-y-0.5">
								<span>New review notifications</span>
								<span className="text-muted-foreground font-normal text-xs">
									Receive notifications when customers leave reviews.
								</span>
							</Label>
							<Switch id="owner-review-notifications" defaultChecked />
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
							<Label htmlFor="owner-email-digest" className="flex flex-col space-y-0.5">
								<span>Weekly digest</span>
								<span className="text-muted-foreground font-normal text-xs">
									Receive a weekly summary of orders and activity.
								</span>
							</Label>
							<Switch id="owner-email-digest" defaultChecked />
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
