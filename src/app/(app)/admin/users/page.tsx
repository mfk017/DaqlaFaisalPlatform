import { requireAdmin } from "@/lib/auth";
import { UserManagement } from "@/components/admin/UserManagement";
import { getT } from "@/lib/i18n";

export default async function AdminUsersPage() {
  await requireAdmin();
  const t = getT("ar");

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>{t("users")}</h1>
      <UserManagement />
    </div>
  );
}
