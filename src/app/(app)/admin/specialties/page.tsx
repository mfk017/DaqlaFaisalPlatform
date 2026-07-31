import { SpecialtyManagement } from "@/components/admin/SpecialtyManagement";

export const metadata = {
  title: 'إدارة التخصصات',
};

export default function SpecialtiesPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة التخصصات</h1>
        <p style={{ color: 'var(--text-secondary)' }}>إضافة وتعديل وحذف التخصصات المتاحة للعمال في النظام.</p>
      </div>
      <SpecialtyManagement />
    </div>
  );
}
