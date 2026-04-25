import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"

export default function StaffSettingsPage() {
	return (
		<DashboardLayout role="staff">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
				<p className="text-muted-foreground text-sm">Staff settings page placeholder.</p>
			</div>
		</DashboardLayout>
	)
}

