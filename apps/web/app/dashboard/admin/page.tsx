import { DashboardLayout } from "../../../features/dashboard/components/DashboardLayout";
import AdminDashboard from "../../../features/dashboard/admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="admin">
      <AdminDashboard />
    </DashboardLayout>
  );
}
