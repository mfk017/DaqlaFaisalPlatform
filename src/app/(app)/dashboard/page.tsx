import { requireApproved } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/Dashboard";

export default async function DashboardPage() {
  await requireApproved();
  return <DashboardContent />;
}
