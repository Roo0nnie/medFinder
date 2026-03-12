import { DashboardLayout } from "../../../features/dashboard/components/DashboardLayout";
import OwnerDashboard from "../../../features/dashboard/owner/OwnerDashboard";

export default function OwnerDashboardPage() {
  return (
    <DashboardLayout role="owner">
      <OwnerDashboard />
    </DashboardLayout>
  );
}
