import { requireApproved } from "@/lib/auth";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await requireApproved();
  
  if (!session.roles.includes('admin')) {
    redirect("/dashboard");
  }

  return <ReportsDashboard />;
}
