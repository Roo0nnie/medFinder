import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"
import { StaffReportsPageContent } from "../../../../features/dashboard/components/staff-reports-page"

export default function StaffReportsPage() {
	return (
		<DashboardLayout role="staff">
			<StaffReportsPageContent />
		</DashboardLayout>
	)
}
