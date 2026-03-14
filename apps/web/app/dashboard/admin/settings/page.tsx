"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"
import { Separator } from "@/core/components/ui/separator"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function AdminSettingsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Settings</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Manage platform-wide settings, security, and admin preferences.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Platform</CardTitle>
						<CardDescription>Global platform configuration and behavior.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="admin-maintenance" className="flex flex-col space-y-0.5">
								<span>Maintenance mode</span>
								<span className="text-muted-foreground font-normal text-xs">
									Show maintenance page to non-admin users.
								</span>
							</Label>
							<Switch id="admin-maintenance" />
						</div>
						<Separator />
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="admin-registration" className="flex flex-col space-y-0.5">
								<span>Allow new registrations</span>
								<span className="text-muted-foreground font-normal text-xs">
									Let new users and pharmacy owners sign up.
								</span>
							</Label>
							<Switch id="admin-registration" defaultChecked />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Security & audit</CardTitle>
						<CardDescription>Audit logging and security options.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="admin-audit-log" className="flex flex-col space-y-0.5">
								<span>Audit logging</span>
								<span className="text-muted-foreground font-normal text-xs">
									Record admin and system actions for audit logs.
								</span>
							</Label>
							<Switch id="admin-audit-log" defaultChecked />
						</div>
						<Separator />
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="admin-2fa" className="flex flex-col space-y-0.5">
								<span>Require 2FA for admins</span>
								<span className="text-muted-foreground font-normal text-xs">
									Enforce two-factor authentication for admin accounts.
								</span>
							</Label>
							<Switch id="admin-2fa" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Notifications</CardTitle>
						<CardDescription>Admin notification preferences.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="admin-email-alerts" className="flex flex-col space-y-0.5">
								<span>Email alerts</span>
								<span className="text-muted-foreground font-normal text-xs">
									Receive email for critical platform events.
								</span>
							</Label>
							<Switch id="admin-email-alerts" defaultChecked />
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
