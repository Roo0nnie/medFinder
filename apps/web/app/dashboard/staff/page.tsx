import { DashboardLayout } from "../../../features/dashboard/components/DashboardLayout";
import StaffDashboard from "../../../features/dashboard/staff/StaffDashboard";

export default function StaffDashboardPage() {
  return (
    <DashboardLayout role="staff">
      <StaffDashboard />
    </DashboardLayout>
  );
}
