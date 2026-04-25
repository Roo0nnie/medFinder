import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"

export default function AdminSettingsPage() {
	return (
		<DashboardLayout role="admin">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
				<p className="text-muted-foreground text-sm">Admin settings page placeholder.</p>
			</div>
		</DashboardLayout>
	)
}

