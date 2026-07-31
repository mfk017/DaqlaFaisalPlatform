import { requireAdmin } from "@/lib/auth";
import { BranchManagement } from "@/components/admin/BranchManagement";
import { getT } from "@/lib/i18n";

export default async function AdminBranchesPage() {
  await requireAdmin();
  const t = getT("ar");

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>{t("branches")}</h1>
      <BranchManagement />
    </div>
  );
}
