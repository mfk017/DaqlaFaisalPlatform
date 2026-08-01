import { requireAdmin } from "@/lib/auth";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { getT } from "@/lib/i18n";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const t = await getT();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>{t("categories")}</h1>
      <CategoryManagement />
    </div>
  );
}
