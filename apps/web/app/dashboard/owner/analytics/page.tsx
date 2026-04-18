import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"
import { OwnerAnalyticsPage } from "../../../../features/dashboard/components/owner-analytics-page"

export default function OwnerAnalyticsRoute() {
	return (
		<DashboardLayout role="owner">
			<OwnerAnalyticsPage />
		</DashboardLayout>
	)
}

